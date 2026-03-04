import { analisarSentimento } from "./services/geminiService.ts";
import { salvarAnalisesLoteSupabase } from "./services/supabaseService.ts";
import { buscarComentariosInstagram } from "./services/instagramService.ts";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint de Eventos Enviados pelo Servidor (SSE) para acompanhamento em tempo real
app.get("/api/analyze", async (req, res) => {
    // Configura o cabeçalho para SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Helper para emitir eventos pro front-end
    const sendEvent = (type: string, data: any) => {
        res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const urlAlvo = typeof req.query.url === 'string' ? req.query.url : (process.env.INSTAGRAM_URL || "https://www.instagram.com/ifoodbrasil/");

    sendEvent("log", { message: `Iniciando Pipeline de Análise para URL: ${urlAlvo}` });

    try {
        sendEvent("log", { message: "Buscando comentários do Instagram via Apify (pode demorar alguns segundos)..." });
        const comentarios = await buscarComentariosInstagram(urlAlvo, 3);

        sendEvent("log", { message: `Foram encontrados ${comentarios.length} comentários para processar.` });

        if (comentarios.length === 0) {
            sendEvent("log", { message: "Nenhum comentário para processar. Encerrando." });
            sendEvent("done", { status: "success", count: 0 });
            return res.end();
        }

        const resultadosAnalisados = [];
        let index = 1;

        for (const objComentario of comentarios) {
            const comentarioText = objComentario.texto;
            sendEvent("progress", { current: index, total: comentarios.length, status: "analyzing", text: comentarioText });

            let sucesso = false;
            let tentativas = 0;
            const maxTentativas = 3;

            while (!sucesso && tentativas < maxTentativas) {
                try {
                    const analise = await analisarSentimento(comentarioText);
                    const bancoData = {
                        texto_original: comentarioText,
                        url_post: objComentario.urlPost,
                        texto_post: objComentario.textoPost,
                        ...analise
                    };
                    resultadosAnalisados.push(bancoData);

                    sendEvent("result", {
                        index,
                        texto_original: comentarioText,
                        url_post: objComentario.urlPost,
                        texto_post: objComentario.textoPost,
                        ...analise
                    });
                    sucesso = true;
                } catch (err) {
                    tentativas++;
                    const errorMessage = (err as Error).message;

                    if (errorMessage.includes("quotaId") && errorMessage.includes("FreeTier")) {
                        sendEvent("log", { message: `❌ ERRO CRÍTICO: Você esgotou o limite DIÁRIO GRATUITO do seu projeto do Gemini (20 requests/dia). Veja https://ai.google.dev/gemini-api/docs/rate-limits` });
                        sendEvent("log", { message: `Interrompendo a varredura baseada nos limites de conta.` });
                        // Para o loop for inteiro para não causar infinite loop no front ou back!
                        sucesso = true;
                        index = comentarios.length;
                        break;
                    } else if (errorMessage.includes("429") || errorMessage.includes("Too Many") || errorMessage.includes("quota")) {
                        sendEvent("log", { message: `⚠️ Cota pontual do Gemini atingida (429). Tentativa ${tentativas}/${maxTentativas} aguardando 60 segundos...` });
                        await sleep(60000); // Espera 60s pra API do Google se recompor
                    } else {
                        sendEvent("log", { message: `❌ ERRO ao analisar comentário ${index}: ${errorMessage}` });
                        break; // Erro fixo, pula pro próximo
                    }
                }
            }

            // Pausa obrigatória de 5 segundos entre cada comentário, sempre! Para cadenciar o frontend e a API.
            if (index < comentarios.length) {
                await sleep(5000);
            }

            index++;
        }

        if (resultadosAnalisados.length > 0) {
            sendEvent("log", { message: `Iniciando gravação de ${resultadosAnalisados.length} registros no Supabase...` });
            await salvarAnalisesLoteSupabase(resultadosAnalisados);
            sendEvent("log", { message: `Gravação concluída com sucesso no Supabase!` });
        }

        sendEvent("done", { status: "success", count: resultadosAnalisados.length });
        res.end();
    } catch (error) {
        sendEvent("error", { message: `Erro catastrófico no pipeline: ${(error as Error).message}` });
        res.end();
    }
});

app.listen(PORT, () => {
    console.log(`Backend de Streaming API rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT}/api/analyze para invocar a rotina via SSE.`);
});

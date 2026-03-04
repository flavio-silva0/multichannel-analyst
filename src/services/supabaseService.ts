import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { FeedbackAnalisado } from "./geminiService.ts";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface RegistroAnalise {
    texto_original: string;
    sentimento: "Positivo" | "Negativo" | "Neutro";
    categoria: "Financeiro" | "Produto" | "Suporte" | "Outros";
    urgencia: number;
    resumo: string;
}

export async function salvarAnalisesLoteSupabase(analises: RegistroAnalise[]) {
    try {
        const records = analises.map(analise => ({
            texto_original: analise.texto_original,
            sentimento: analise.sentimento,
            categoria: analise.categoria,
            urgencia: analise.urgencia,
            resumo: analise.resumo,
            criado_em: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from("feedbacks_analisados")
            .insert(records);

        if (error) {
            throw error;
        }

        console.log(`${records.length} análises salvas com sucesso no Supabase!`);
        return data;
    } catch (error) {
        console.error("Erro ao salvar dados em lote no Supabase:", error);
        throw new Error("Falha na gravação em lote do banco de dados");
    }
}

export async function salvarAnaliseSupabase(textoOriginal: string, analise: FeedbackAnalisado) {
    try {
        const { data, error } = await supabase
            .from("feedbacks_analisados")
            .insert([
                {
                    texto_original: textoOriginal,
                    sentimento: analise.sentimento,
                    categoria: analise.categoria,
                    urgencia: analise.urgencia,
                    resumo: analise.resumo,
                    criado_em: new Date().toISOString()
                }
            ]);

        if (error) {
            throw error;
        }

        console.log("Análise salva com sucesso no Supabase!");
        return data;
    } catch (error) {
        console.error("Erro ao salvar dados no Supabase:", error);
        throw new Error("Falha na gravação do banco de dados");
    }
}

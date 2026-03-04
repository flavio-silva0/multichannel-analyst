import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface FeedbackAnalisado {
    sentimento: "Positivo" | "Negativo" | "Neutro";
    categoria: "Financeiro" | "Produto" | "Suporte" | "Outros";
    urgencia: number;
    resumo: string;
}

const responseSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        sentimento: {
            type: SchemaType.STRING,
            description: "O sentimento da mensagem (Positivo, Negativo, Neutro)",
            format: "enum",
            enum: ["Positivo", "Negativo", "Neutro"]
        },
        categoria: {
            type: SchemaType.STRING,
            description: "A categoria do problema (Financeiro, Produto, Suporte, Outros)",
            format: "enum",
            enum: ["Financeiro", "Produto", "Suporte", "Outros"]
        },
        urgencia: {
            type: SchemaType.INTEGER,
            description: "A urgência do problema (1 a 5, onde 1 é baixa e 5 é crítica)"
        },
        resumo: {
            type: SchemaType.STRING,
            description: "Um resumo curto do problema reportado pelo cliente (máx 150 caracteres)"
        }
    },
    required: ["sentimento", "categoria", "urgencia", "resumo"]
};

export async function analisarSentimento(texto: string): Promise<FeedbackAnalisado> {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Você é um Analista de RevOps (Revenue Operations) sênior. Sua tarefa é analisar o feedback de clientes e extrair informações estruturadas. Seja rigoroso com a categorização e a avaliação de urgência.",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const prompt = `Analise o seguinte feedback do cliente:\n\n"${texto}"`;
        const result = await model.generateContent(prompt);

        const responseText = result.response.text();
        const jsonResult: FeedbackAnalisado = JSON.parse(responseText);

        return jsonResult;
    } catch (error) {
        console.error("Erro ao analisar sentimento no Gemini:", error);
        throw new Error("Falha na análise de sentimento");
    }
}

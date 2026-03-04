import { ApifyClient } from "apify-client";
import dotenv from "dotenv";

dotenv.config();

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || "",
});

export interface InstagramCommentData {
    texto: string;
    urlPost: string;
    textoPost: string;
}

export async function buscarComentariosInstagram(perfilUrl: string, limitePosts: number = 3): Promise<InstagramCommentData[]> {
    try {
        if (!process.env.APIFY_API_TOKEN) {
            console.warn("Aviso: Chave APIFY_API_TOKEN ausente. Usando mock de comentários.");
            return mockComentarios();
        }

        // Configuração para uso do Actor `apify/instagram-scraper` focado em Perfis e Comentários
        const input = {
            addParentData: false,
            directUrls: [perfilUrl], // Ex: https://www.instagram.com/ifoodbrasil/
            enhanceUserSearchWithFacebookPage: false,
            isUserReelFeedURL: false,
            isUserTaggedFeedURL: false,
            resultsLimit: 3, // Pega os últimos 3 posts do perfil
            resultsType: "posts", // Começa buscando pelos posts do perfil
            searchLimit: 1,
            searchType: "hashtag",
            scrollWaitSecs: 2
        };

        console.log(`Buscando últimos 3 posts na URL: ${perfilUrl} via Apify...`);

        // NOTA: Para rodar esse scraper, o Actor apify/instagram-scraper da Apify deve estar configurado no seu token
        console.log("Iniciando varredura com Apify...");
        const runPosts = await client.actor("apify/instagram-scraper").call(input as any);
        const { items: posts } = await client.dataset(runPosts.defaultDatasetId).listItems();

        if (!posts || posts.length === 0) {
            console.log("Nenhum post encontrado neste perfil.");
            return [];
        }

        const postUrls: string[] = [];
        const postMap = new Map<string, string>();

        for (const p of posts as any[]) {
            if (p.url) {
                postUrls.push(p.url);
                postMap.set(p.url, p.caption || p.text || "");
            }
        }

        console.log(`Encontrados ${postUrls.length} posts. Buscando os top 10 comentários de cada...`);

        const commentInput = {
            directUrls: postUrls,
            resultsType: "comments",
            resultsLimit: 10,
        };

        const runComments = await client.actor("apify/instagram-scraper").call(commentInput as any);
        const { items: comments } = await client.dataset(runComments.defaultDatasetId).listItems();

        // Relaciona o comentário ao Post Pai
        const result: InstagramCommentData[] = [];
        for (const item of comments as any[]) {
            const texto = item.text || item.comment;
            if (!texto) continue;

            const urlPost = item.postUrl || item.url || postUrls[0] || "";
            const legendaOriginal = postMap.get(urlPost) || "";
            // Pega os primeiros 80 caracteres da legenda do post para contexto
            const textoPost = legendaOriginal.length > 80 ? legendaOriginal.substring(0, 80) + "..." : legendaOriginal;

            result.push({
                texto,
                urlPost,
                textoPost
            });
        }

        return result;

    } catch (error) {
        console.error(`Erro na chamada da Apify (${(error as Error).message}). Retornando dados mockados base pro pipeline não quebrar.`);
        return mockComentarios();
    }
}

function mockComentarios(): InstagramCommentData[] {
    return [
        {
            texto: "Amei o novo layout do app, ficou super intuitivo! Parabéns a toda a equipe.",
            urlPost: "https://www.instagram.com/p/EXEMPLO_POST_1/",
            textoPost: "Lançamento da nova funcionalidade para facilitar a sua vida!"
        },
        {
            texto: "Estou tentando estornar uma compra tem mais de duas semanas e ninguém no chat me responde. Pior suporte da vida, quero cancelar tudo!!!",
            urlPost: "https://www.instagram.com/p/EXEMPLO_POST_2/",
            textoPost: "Como resolvemos os problemas no chat de suporte rápido. #Tech"
        },
        {
            texto: "Gostaria de saber se a funcionalidade de exportação em PDF vai voltar, eu usava bastante no meu dia a dia.",
            urlPost: "https://www.instagram.com/p/EXEMPLO_POST_3/",
            textoPost: "Aviso de manutenção nas exportações amanhã à noite."
        }
    ];
}

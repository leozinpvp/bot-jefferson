import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.API_GEMINI;
if (!apiKey) {
    console.error("Erro: A variável de ambiente API_GEMINI não foi definida.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const geminiChatSession = model.startChat({ history: [] });

/**
 * Gera e envia uma lista de comandos formatada e estilizada.
 * 
 * @param {import("whatsapp-web.js").Message} ctx - Contexto da mensagem recebida.
 */

export async function useAi(ctx) {
    const cleanMsg = ctx.body.replace(/^!ia\s+/i, '');

    const input = cleanMsg.trim();
    if (!input) {
        await ctx.reply("⚠️ Escreva algo após o comando, ex: `!ia olá`");
        return;
    }

    try {
        const result = await geminiChatSession.sendMessage(input);
        const response = result.response;
        await ctx.reply(response.text());
    } catch (error) {
        console.error("Erro ao contatar a API do Gemini:", error);
        await ctx.reply("🤖 Desculpe, não consegui processar sua solicitação no momento.");
    }
}

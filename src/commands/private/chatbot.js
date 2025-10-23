
import { execCommand, isCommand } from "../commands.js";
import { botsHistories, inChatBot } from "./chatbot/array.js";
import { commandsChatBot } from "./chatbot/commands.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.API_GEMINI;
if (!apiKey) {
    console.error("Erro: A variável de ambiente API_GEMINI não foi definida.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
export const botsInstances = {};

/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 * @param {import("whatsapp-web.js").Client} client 
 */
export default async function initChatBot(ctx, client) {
    inChatBot.add(ctx.from);

    botsInstances[ctx.from] = model.startChat({ history: [] })

    ctx.reply("Chat bot iniciado:\nOs comandos padrões não funcionarão neste modo\nDigite \"!exit\" para encerrar")
}

/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 * @param {import("whatsapp-web.js").Client} client 
 */
export async function endChatBot(ctx, client) {
    inChatBot.delete(ctx.from)

    ctx.reply("Chat bot encerrado")

    delete botsInstances[ctx.from];
}

/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 * @param {import("whatsapp-web.js").Client} client 
 */
export async function chatbot(ctx, client) {
    if (!inChatBot.has(ctx.from)) return;

    if (!botsInstances[ctx.from]) {
        botsInstances[ctx.from] = model.startChat({ history: botsHistories?.[ctx.from] || [] })
    }

    let clearMsg = ctx.body.trim().toLowerCase();
    const cleanMsg = clearMsg.replace(/^!ia\s+/i, '').trim();

    if (isCommand(clearMsg)) {

        execCommand(ctx, client, commandsChatBot);

        return;
    }

    const result = await botsInstances[ctx.from].sendMessage(cleanMsg);

    botsHistories[ctx.from] = botsInstances[ctx.from]._history

    const response = result.response;
    await ctx.reply(response.text());
}
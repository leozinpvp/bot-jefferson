import isAdmin from "../database/group/isAdmin.js";
import verifyGroup from "../database/group/verifyGroup.js";
import { useAi } from "./ai/ai.js";
import helpCommand from "./basic/help.js";
import { useAiImage } from "./ai/image.js";
import { adminAgp, agp, dgp, perms } from "./admin/perms.js";
import ping from "./basic/ping.js";
import playMp3 from "./basic/play.js";
import playVid from "./basic/playvid.js";
import { qc } from "./basic/qc.js";
import ttsFun from "./ai/tts.js";
import ytSearch from "./basic/yts.js";
import initChatBot from "./private/chatbot.js";

export const commands = [
    {
        name: 'chatbot',
        family: 'private',
        fun: initChatBot,
        desc: 'Inicia um chatbot, uso da ia sem ficar toda hora usando !ai. Exemplo: "!chatbot".'
    },
    // 🧩 Comandos básicos
    {
        name: 'ping',
        family: 'basic',
        fun: ping,
        desc: 'Executa um teste de resposta do bot. Exemplo: "!ping".'
    },
    {
        name: 'play',
        family: 'basic',
        fun: playMp3,
        desc: 'Reproduz um video como mp3. Exemplo: "!play <link ou texto>".'
    },
    {
        name: 'playvid',
        family: 'basic',
        fun: playVid,
        desc: 'Reproduz um video. Exemplo: "!playvid <link ou texto>".'
    },
    {
        name: 'yts',
        family: 'basic',
        fun: ytSearch,
        desc: 'Pesquisa video no youtube. Exemplo: "!yts <texto>".'
    },
    {
        name: 'perms',
        family: 'admin',
        fun: perms,
        desc: 'Mostra a lista de comandos atualmente permitidos no grupo.'
    },
    {
        name: 'help',
        family: 'global',
        fun: helpCommand,
        desc: 'Mostra esta tela'
    },
    {
        name: 'menu',
        family: 'global',
        fun: helpCommand,
        desc: 'Mostra esta tela'
    },
    {
        name: 'qc',
        family: 'basic',
        fun: qc,
        desc: 'Cria uma figurinha com um balão de mensagem. Exemplo: "!qc Olá mundo!".'
    },
    // 🛡️ Comandos administrativos
    {
        name: 'agp',
        family: 'admin',
        fun: agp,
        desc: 'Autoriza comandos no grupo. Use: "!agp <comando>". Exemplo: "!agp ai ping".'
    },
    {
        name: 'aagp',
        family: 'admin',
        fun: adminAgp,
        desc: 'Autoriza comandos no grupo, mas só para admin. Use: "!aagp <comando>". Exemplo: "!aagp ai ping".'
    },
    {
        name: 'dgp',
        family: 'admin',
        fun: dgp,
        desc: 'Remove a autorização de um comando no grupo. Exemplo: "!dgp ai".'
    },
    {
        name: 'call_all',
        family: 'admin',
        fun: ping,
        desc: 'Menciona todos os membros do grupo.'
    },

    // 🤖 Comandos de IA
    {
        name: 'ai',
        family: 'ai',
        fun: useAi,
        desc: 'Usa o modelo Gemini 2.5 Flash para responder mensagens. Exemplo: "!ai o que é JavaScript?".'
    },
    {
        name: 'tts',
        family: 'ai',
        fun: ttsFun,
        desc: 'Usa gtts-cli para para gerar audio com base no texto, TTS significa Text To Speech. Exemplo: "!tts Olá mundo".'
    },
    {
        name: 'image',
        family: 'ai',
        fun: useAiImage.bind(null, false),
        desc: 'Gera uma imagem com o modelo Gemini 2.0. Exemplo: "!image gato astronauta".'
    },
    {
        name: 'imagem',
        family: 'ai',
        fun: useAiImage.bind(null, false),
        desc: 'Gera uma imagem com o modelo Gemini 2.0 (sinônimo de "!image").'
    },
    {
        name: 'fig',
        family: 'ai',
        fun: useAiImage.bind(null, true),
        desc: 'Gera uma figurinha a partir de uma imagem criada pela IA. Exemplo: "!strick gato no espaço".'
    },
];


export function isCommand(message) {
    if (message[0] === "!") return true;
}

/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 * @param {import("whatsapp-web.js").Client} client 
 */
export async function execCommand(ctx, client, commandsBase = commands) {
    const commandText = ctx.body;
    const [commandName] = commandText.slice(1).split(' ');
    const chat = await ctx.getChat();
    const command = commandsBase.find(({ name }) => name.toLocaleLowerCase() === commandName.toLocaleLowerCase());
    const admin = chat.isGroup ? await isAdmin(ctx) : false;

    if (!command) return ctx.reply('⚠️ Comando inexistente');

    else if (command.family === 'global') return command.fun(ctx);

    else if (!chat.isGroup) {
        if (command.family === "admin") return ctx.reply("⚠️ Aqui não é um grupo");

        return command.fun(ctx, client);
    }

    if (command.family === 'private') return;

    if (command.family === "admin") {
        if (!admin) return ctx.reply('⚠️ Você precisa ser admin para usar este comando.');

        return await command.fun(ctx, client)
    }

    const { ok, msg, admin: onlyAdmin } = await verifyGroup(chat.id._serialized, command);

    if (!ok) return msg && ctx.reply(msg)
    if (onlyAdmin && !admin) return;

    command.fun(ctx, client);
}   
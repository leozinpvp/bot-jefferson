
import yts from "yt-search";
import whatsappPkg from "whatsapp-web.js";
import { isLink } from "../../database/mongodb.js";
import fs from 'fs'
import { getAudioBuffer, normalizeYouTubeUrl, webmToMp3 } from "../../youtube/download.js";

const { MessageMedia } = whatsappPkg;


/**
 * Baixa o áudio de um vídeo do YouTube e gera MP3.
 * 
 * @param {import("whatsapp-web.js").Message} ctx
 * @param {string} args - Contexto da mensagem recebida.
 * @param {import("whatsapp-web.js").Client} client - Contexto da mensagem recebida.
 */
export default async function playMp3(ctx, client) {
    const cleanMsg = ctx.body.replace(/^!play\s+/i, '').trim();
    const chat = await ctx.getChat()
    const chatId = chat.id;
    const text = cleanMsg;
    const searchQuery = text.trim()
    let url;
    let title

    if (isLink(text)) {
        url = normalizeYouTubeUrl(cleanMsg);
    }

    else if (!searchQuery) {
        return await ctx.reply("Qual o som que deseja reproduzir?");
    }

    if (!url) {
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) return await ctx.sendMessage(chatId, {
            text: "Não encontrado nenhum video!"
        });

        await ctx.reply("Baixando o video, aguarde...")

        const video = videos[0];
        url = video.url;
        title = video.title
    }

    try {
        title = title || 'output';
        const videoBuffer = await getAudioBuffer(normalizeYouTubeUrl(url));

        if (!videoBuffer) {
            return await ctx.reply("Erro ao obter ou converter o video. Tente novamente mais tarde.");
        }

        const inputBuffer = Buffer.from(videoBuffer);
        const output = `${title.replaceAll(' ', '_')}`
        const audioBuffer = await webmToMp3(output, inputBuffer)

        const media = new MessageMedia(
            'audio/mpeg',
            audioBuffer.toString('base64'),
            `${title}.mp3`
        );

        await ctx.reply(`Aqui o video "${output}" como mp3:`)
        await client.sendMessage(ctx.from, media, { sendAudioAsVoice: false });

        fs.unlinkSync(`${output}.webm`);
        fs.unlinkSync(`${output}.mp3`);
    } catch (error) {
        console.log(error);

        return await ctx.reply("Erro ao obter ou converter o video. Tente novamente mais tarde.");
    }
}


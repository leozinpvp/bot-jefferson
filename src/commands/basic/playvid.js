
import yts from "yt-search";
import whatsappPkg from "whatsapp-web.js";
import { isLink } from "../../database/mongodb.js";
import fs from 'fs'
import { getVideoBuffer, normalizeYouTubeUrl, webmToMp3, webmToMp4 } from "../../youtube/download.js";

const { MessageMedia } = whatsappPkg;


/**
 * Baixa o áudio de um vídeo do YouTube e gera MP3.
 * 
 * @param {import("whatsapp-web.js").Message} ctx
 * @param {string} args - Contexto da mensagem recebida.
 * @param {import("whatsapp-web.js").Client} client - Contexto da mensagem recebida.
 */
export default async function playVid(ctx, client) {
    const cleanMsg = ctx.body.replace(/^!playvideo\s+/i, '').trim();
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
        return await ctx.reply("Pesquise algo, use: !playvideo <texto ou link>");
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
        const videoBufferBase = await getVideoBuffer(normalizeYouTubeUrl(url));

        if (!videoBufferBase) {
            return await ctx.reply("Erro ao obter ou converter o video. Tente novamente mais tarde.");
        }

        const inputBuffer = Buffer.from(videoBufferBase);
        const output = `${title.replaceAll(' ', '_')}`
        const videoBuffer = await webmToMp4(output, inputBuffer)

        const media = new MessageMedia(
            "video/mp4",
            videoBuffer.toString("base64"),
            `${outputFile}.mp4`
        );

        if (fs.existsSync(`${outputFile}.webm`)) fs.unlinkSync(`${outputFile}.webm`);
        if (fs.existsSync(`${outputFile}.mp4`)) fs.unlinkSync(`${outputFile}.mp4`);

        await ctx.reply(`Aqui o video "${output}" como mp3:`)
        await client.sendMessage(ctx.from, media, { sendAudioAsVoice: false });

    } catch (error) {
        console.log(error);

        return await ctx.reply("Erro ao obter ou converter o video. Tente novamente mais tarde.");
    }
}


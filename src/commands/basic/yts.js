import yts from "yt-search";
import whatsappPkg from "whatsapp-web.js";
import axios from "axios";
import fs from 'fs'
import { getAudioBuffer, getVideoBuffer, normalizeYouTubeUrl, webmToMp3, webmToMp4 } from "../../youtube/download.js";

const { MessageMedia } = whatsappPkg;

/**
 * @param { import("whatsapp-web.js").Message } ctx
 * @param { string } args
 * @param { import("whatsapp-web.js").Client } client
 */
export default async function ytSearch(ctx, client) {
    const cleanMsg = ctx.body.replace(/^!play\s+/i, '').trim();
    const chat = await ctx.getChat();
    const chatId = chat.id._serialized;
    const searchQuery = cleanMsg.trim();

    if (!searchQuery) {
        return await ctx.reply("Pesquise algo, use: !yts <texto>");
    }

    const { videos } = await yts(searchQuery);
    if (!videos || videos.length === 0) {
        return await ctx.sendMessage(chatId, { text: "Nenhum vídeo encontrado!" });
    }

    let menuText = "Escolha uma opção digitando o número correspondente:\n\n";
    videos.forEach((video, i) => {
        menuText += `${i + 1}. ${video.title}\n`;
    });
    menuText += "\nVocê tem 30 segundos para responder.";

    await ctx.reply(menuText);

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            client.removeListener('message_create', handler);
            reject(new Error("Tempo esgotado para escolher uma opção."));
        }, 30000);

        const handler = async msg => {
            if (msg.from !== chatId || msg.fromMe) return;

            const choice = parseInt(msg.body, 10);
            if (!isNaN(choice) && choice >= 1 && choice <= videos.length) {
                clearTimeout(timeout);
                client.removeListener('message_create', handler);
                const video = videos[choice - 1];
                await viewVideoOptions(client, msg, video);
                resolve();
            } else {
                await ctx.reply(`Opção ${msg.body} invalida, escolha de 1-${videos.length}`)
            }
        };

        client.on('message_create', handler);
    }).catch(async () => {
        await ctx.reply("Você não respondeu a tempo ou digitou uma opção inválida.");
    });
}
/**
 * Mostra opções de download para o vídeo escolhido
 * @param { import("whatsapp-web.js").Client } client
 * @param { import("whatsapp-web.js").Message } ctx
 * @param { import("yt-search").VideoSearchResult } video
 */
export async function viewVideoOptions(client, ctx, video) {
    const { thumbnail, title, url } = video;
    const menuText = `Você escolheu:\n*${title}*\n\nEscolha uma opção digitando o número:\n1. Baixar como vídeo\n2. Baixar como áudio\n\n${url}`;

    try {
        const { data } = await axios.get(thumbnail, { responseType: "arraybuffer" });
        const media = new MessageMedia("image/png", Buffer.from(data).toString("base64"), "thumbnail.png");

        await client.sendMessage(ctx.from, media, { caption: menuText });
    } catch {
        await ctx.reply(menuText);
    }

    await new Promise((resolve) => {
        let timeout;
        const handler = async (msg) => {
            if (msg.from !== ctx.from || msg.fromMe) return;

            const choice = parseInt(msg.body.trim(), 10);
            const outputFile = `${title.replaceAll(" ", "_")}`;

            try {
                clearTimeout(timeout);
                client.removeListener("message_create", handler);
                switch (choice) {
                    case 1: {
                        const videoBufferBase = await getVideoBuffer(normalizeYouTubeUrl(url));
                        const inputBuffer = Buffer.from(videoBufferBase);
                        const videoBuffer = await webmToMp4(outputFile, inputBuffer);

                        const mediaVideo = new MessageMedia(
                            "video/mp4",
                            videoBuffer.toString("base64"),
                            `${outputFile}.mp4`
                        );

                        if (fs.existsSync(`${outputFile}.webm`)) fs.unlinkSync(`${outputFile}.webm`);
                        if (fs.existsSync(`${outputFile}.mp4`)) fs.unlinkSync(`${outputFile}.mp4`);

                        await ctx.reply(`Aqui está o vídeo *${title}* 🎥`);
                        await client.sendMessage(ctx.from, mediaVideo);
                        break;
                    }

                    case 2: {
                        const videoBufferAudio = await getAudioBuffer(normalizeYouTubeUrl(url));

                        if (!videoBufferAudio) {
                            await ctx.reply("Erro ao obter o áudio. Tente novamente mais tarde.");
                            break;
                        }

                        const inputBuffer = Buffer.from(videoBufferAudio);
                        const audioBuffer = await webmToMp3(outputFile, inputBuffer);

                        const mediaAudio = new MessageMedia(
                            "audio/mpeg",
                            audioBuffer.toString("base64"),
                            `${outputFile}.mp3`
                        );

                        await ctx.reply(`Aqui está o áudio *${title}* 🎧`);
                        await client.sendMessage(ctx.from, mediaAudio, { sendAudioAsVoice: false });

                        // Remove arquivos temporários, se existirem
                        if (fs.existsSync(`${outputFile}.webm`)) fs.unlinkSync(`${outputFile}.webm`);
                        if (fs.existsSync(`${outputFile}.mp3`)) fs.unlinkSync(`${outputFile}.mp3`);
                        break;
                    }

                    default:
                        await ctx.reply(`Opção *${msg.body}* inválida. Escolha 1 ou 2, tente novamente.`);

                }

                resolve();
            } catch (err) {
                console.error("Erro ao processar escolha:", err);
                await ctx.reply("Ocorreu um erro ao processar sua solicitação.");
                clearTimeout(timeout);
                client.removeListener("message_create", handler);
                resolve();
            }
        };

        client.on("message_create", handler);

        timeout = setTimeout(() => {
            client.removeListener("message_create", handler);
            ctx.reply("⏰ Tempo esgotado para escolher uma opção.");
            resolve();
        }, 30000);
    });
}
import whatsappPkg from "whatsapp-web.js";
import { execTTS, isValidGttsLang, listGttsLang } from "../../functions/exec-tts.js";
const { MessageMedia } = whatsappPkg;

/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx
 * @param {import("whatsapp-web.js").Client} client - Contexto da mensagem recebida.
 */
export default async function ttsFun(ctx, client) {
    const cleanMsg = ctx.body.replace(/^!tts\s+/i, '').trim();

    const input = cleanMsg.trim();
    if (!input) {
        await ctx.reply("⚠️ Escreva algo após o comando, ex: `!tts Olá mundo`");
        return;
    }

    if (input.toLocaleLowerCase().trim() === '-lang'
        || input.toLocaleLowerCase().trim() === '-l') {
        await ctx.reply(listGttsLang());
        return
    }

    const [lang, ...textFinal] = input.split(' ');
    const validLang = isValidGttsLang(lang);

    try {
        const audioBuffer = validLang ?
            execTTS(textFinal.join(' '), lang) :
            execTTS(input);

        const media = new MessageMedia(
            'audio/mpeg',
            audioBuffer.toString('base64'),
            `audio-tts-${Date.now()}.mp3`
        );

        await client.sendMessage(ctx.from, media, { sendAudioAsVoice: false });
    } catch (error) {
        console.error("Erro ao usar a lib:", error);
        await ctx.reply("🤖 Desculpe, não consegui processar sua solicitação no momento.");
    }
}
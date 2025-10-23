
import axios from "axios";
import whatsappPkg from "whatsapp-web.js";
const { MessageMedia } = whatsappPkg;

/**
 * Gera e envia uma lista de comandos formatada e estilizada.
 * 
 * @param {import("whatsapp-web.js").Message} ctx - Contexto da mensagem recebida.
 * @param {import("whatsapp-web.js").Client} client - Contexto da mensagem recebida.
 */
export async function qc(ctx, client) {
    const contact = await ctx.getContact()
    const imageUri = await contact.getProfilePicUrl();
    const cleanMsg = ctx.body.replace(/^!qc\s+/i, '').trim();

    const uri = 'https://bot.lyo.su/quote/generate';

    const body = {
        "type": "quote",
        "format": "png",
        "backgroundColor": "#FFFFFF",
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [{
            "entities": [],
            "avatar": true,
            "from": {
                "id": 1,
                "name": contact.name,
                "photo": {
                    "url": imageUri
                }
            },
            "text": cleanMsg,
            "replyMessage": {}
        }]
    }


    const res = await axios.post(uri, body, {
        headers: {
            "Content-Type": 'application/json'
        }
    })

    if (!res.data.result.image) {
        return ctx.reply("🤖 Erro ao gerar")
    }

    const media = new MessageMedia('image/png', res.data.result.image, 'image.png');

    await client.sendMessage(ctx.from, media, { sendMediaAsSticker: true });
}
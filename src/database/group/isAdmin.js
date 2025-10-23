
/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 */
export default async function isAdmin(ctx) {
    const contact = await ctx.getContact();
    const chat = await ctx.getChat();
    const admins = new Set(chat.participants.filter(p => p.isAdmin || p.isSuperAdmin).map(p => p.id._serialized));

    const senderIsAdmin = admins.has(contact.id._serialized);

    return senderIsAdmin
}
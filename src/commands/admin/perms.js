import allowGroup from "../../database/group/allowGroup.js";
import disallowGroup from "../../database/group/disallowGroup.js";
import { getCol } from "../../database/mongodb.js";
import { commands } from "../commands.js";


/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 */
export async function agp(ctx) {
    const chat = await ctx.getChat();

    const res = await allowGroup(chat.id._serialized, ctx);

    ctx.reply(res.message)
}

/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 */
export async function adminAgp(ctx) {
    const chat = await ctx.getChat();

    const res = await allowGroup(chat.id._serialized, ctx, true);

    ctx.reply(res.message)
}
/**
 * 
 * @param {import("whatsapp-web.js").Message} ctx 
 */
export async function dgp(ctx) {
    const chat = await ctx.getChat();
    const args = ctx.body.replace(/^!dgp\s+/i, '').trim().split(' ');

    const res = await disallowGroup(chat.id._serialized, args);

    ctx.reply(res.message)
}

const familyLabels = {
    basic: '🧩 Comuns',
    restrict: '🔒 Restritos',
    admin: '🛡️ Administrativos',
    ai: '🤖 Inteligência Artificial',
    global: '💠 Global'
};

/**
 * Exibe a lista de comandos permitidos no grupo.
 * 
 * @param {import("whatsapp-web.js").Message} ctx
 */
export async function perms(ctx) {
    const chat = await ctx.getChat();

    // Certifica-se de que é um grupo
    if (!chat.isGroup) {
        return ctx.reply('⚠️ Este comando só pode ser usado em grupos.');
    }

    const groups = getCol('groups');
    const group = await groups.findOne({ group_id: chat.id._serialized });

    if (!group) {
        return ctx.reply('⚠️ Grupo não catalogado. Use *!agp [comando]* para registrar.');
    }

    const allowed = group.allowed_commands || [];

    if (allowed.length === 0) {
        return ctx.reply(`🚫 Nenhum comando está permitido neste grupo.\nUse *!agp [comando]* para autorizar.`);
    }


    const allowedCmds = commands.filter(cmd =>
        allowed.includes(cmd.name.toLowerCase())
    );

    // Agrupa por família
    const grouped = allowedCmds.reduce((acc, cmd) => {
        (acc[cmd.family] ??= []).push(cmd);
        return acc;
    }, {});

    // Cabeçalho formatado
    let menu = `
╭━━━📜 *Lista de Comandos Permitidos* ━━━╮
┃ Grupo: *${chat.name}*
┃ 💬 _Use os comandos exatamente como aparecem abaixo._
┃ 
`;

    // Monta as seções
    for (const [family, cmds] of Object.entries(grouped)) {
        const title = familyLabels[family] || `💠 *${family}*`;
        menu += `┃ ━━ ${title} ━━\n`;
        for (const cmd of cmds) {
            menu += `┃ • *!${cmd.name}* — ${cmd.desc}\n`;
        }
        menu += `┃\n`;
    }

    menu += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    ctx.reply(menu.trim());
}

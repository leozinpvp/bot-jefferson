import { commands } from '../commands.js';

const familyLabels = {
    basic: '🧩 *Comuns*',
    restrict: '🔒 *Restritos*',
    admin: '🛡️ *Administrativos*',
    ai: '🤖 *Inteligência Artificial*',
    global: '🌐 *Globais*'
};

/**
 * Gera e envia uma lista de comandos formatada e estilizada.
 * 
 * @param {import("whatsapp-web.js").Message} ctx - Contexto da mensagem recebida.
 */
export default async function helpCommand(ctx) {
    // Agrupa comandos por categoria
    const grouped = commands.reduce((acc, cmd) => {
        (acc[cmd.family] ??= []).push(cmd);
        return acc;
    }, {});

    // Cabeçalho
    let menu = `
╭━━━📜 *Lista de Comandos* ━━━╮
┃ 
┃ 💬 *Use os comandos exatamente como aparecem.*
┃ Alguns podem exigir permissões específicas.
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;

    // Monta cada categoria
    for (const [family, cmds] of Object.entries(grouped)) {
        const title = familyLabels[family] || `💠 *${family}*`;
        menu += `\n━━━ ${title} ━━━\n`;

        for (const cmd of cmds) {
            menu += `• *!${cmd.name}* → ${cmd.desc}\n`;
        }
    }

    // Rodapé
    menu += '\n✨ Digite *!help nome_do_comando* para detalhes (em breve)\n';

    await ctx.reply(menu.trim());
}

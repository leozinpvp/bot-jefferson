import { getCol } from "../mongodb.js";

export default async function verifyGroup(group_id, command) {
    const groups = getCol('groups');
    const group = await groups.findOne({ group_id });

    if (!group) return {
        ok: false,
        msg: null
    };

    const commands = [
        ...(group.allowed_commands || []).map(cmd => ({
            onlyAdmin: false,
            cmd
        })),
        ...(group.admin_commands || []).map(cmd => ({
            onlyAdmin: true,
            cmd
        }))
    ];

    const commandTarget = commands.find(({ cmd }) => command.name === cmd);

    return commandTarget
        ? { ok: true, msg: null, admin: commandTarget.onlyAdmin }
        : { ok: false, msg: '⚠️ Comando não autorizado para este grupo', admin: false };
}

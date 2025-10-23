import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const __rootProject = path.resolve(__dirname, "../../");

export function execTTS(text, lang = 'pt') {
    text = text.replace(/^-+/, "");

    const base = path.join(__rootProject, "gtts");
    const output = path.join(base, `output-${Date.now()}.mp3`)

    if (!existsSync(base)) {
        mkdirSync(base)
    }

    execSync(`gtts-cli "${text.replace('"', "\\\"")}" --lang ${lang} -o ${output}`);

    const audioBuffer = readFileSync(output);

    unlinkSync(output)

    return audioBuffer
}

export function isValidGttsLang(langExpect) {
    const res = execSync(`gtts-cli --all`, { encoding: 'utf-8' }).split("\n");

    for (const line of res) {
        if (line.trim().startsWith(`${langExpect}:`)) {
            return true;
        }
    }

    return false
}

export function listGttsLang() {
    const res = execSync(`gtts-cli --all`, { encoding: 'utf-8' }).split("\n");
    const message = [
        "Lista dos idiomas do !tts"
    ]

    let lineIndex = 1;
    for (const line of res) {
        if (line.trim()) {
            message.push(`${lineIndex}. ${line.trim()}`.trim());
            lineIndex++;
        }
    }

    return message.join('\n')
}
import path from 'path';
import { __rootProject } from './exec-tts.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const ROOT_JSON_FILES = path.join(__rootProject, 'datas');

/**
 * Salva dados em JSON, tratando Set/Array/Objeto
 */
export function saveJSON(filename, data) {
    if (!existsSync(ROOT_JSON_FILES)) {

        mkdirSync(ROOT_JSON_FILES, { recursive: true });
    }

    let toSave = data;

    if (data instanceof Set) {
        toSave = Array.from(data);
    }

    writeFileSync(
        path.join(ROOT_JSON_FILES, `${filename}.json`),
        JSON.stringify(toSave, null, 3)
    );
}

/**
 * Carrega dados de JSON, retorna defaultData se arquivo não existir
 */
export function loadJSON(filename, defaultData) {
    const filePath = path.join(ROOT_JSON_FILES, `${filename}.json`);

    if (!existsSync(filePath)) {
        saveJSON(filename, defaultData);
        return defaultData;
    }

    try {
        const raw = readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);

        if (defaultData instanceof Set) {
            return new Set(parsed);
        }

        return parsed;
    } catch (err) {
        console.error(`Erro ao carregar ${filename}.json:`, err);
        return defaultData;
    }
}

/**
 * Cria um Proxy que salva automaticamente alterações
 */
export function createPersistentProxy(filename, defaultData) {
    let data = loadJSON(filename, defaultData);

    // 🔧 Corrige caso o defaultData seja um Set
    if (defaultData instanceof Set && Array.isArray(data)) {
        data = new Set(data);
    }

    const handler = {
        get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
                return function (...args) {
                    const result = value.apply(target, args);
                    // Salva corretamente dependendo do tipo
                    if (target instanceof Set) {
                        saveJSON(filename, Array.from(target));
                    } else {
                        saveJSON(filename, target);
                    }
                    return result;
                };
            }
            return value;
        },
        set(target, prop, value) {
            target[prop] = value;
            saveJSON(filename, target instanceof Set ? Array.from(target) : target);
            return true;
        }
    };

    return new Proxy(data, handler);
}

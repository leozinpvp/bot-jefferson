import youtubedl from 'youtube-dl-exec'
import fs from 'fs'
import Ffmpeg from "fluent-ffmpeg";

export function getAudioBuffer(url) {
    try {
        const audioProcess = youtubedl.exec(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            format: 'bestaudio',
            output: '-',
        });
        const chunks = [];

        return new Promise((resolve, reject) => {

            audioProcess.stdout.on('data', (chunk) => {
                chunks.push(chunk)
            })

            audioProcess.on('error', (err) => {
                reject(err);
            });

            audioProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Stream do yt-dlp finalizado, concatenando buffer.');
                    resolve(Buffer.concat(chunks));
                } else {
                    reject(new Error(`yt-dlp saiu com o código ${code}`));
                }
            })
        })
    } catch (error) {
        return undefined;
    }
}

export function getVideoBuffer(url) {
    try {
        const audioProcess = youtubedl.exec(url, {
            output: '-',
        });
        const chunks = [];

        return new Promise((resolve, reject) => {

            audioProcess.stdout.on('data', (chunk) => {
                chunks.push(chunk)
            })

            audioProcess.on('error', (err) => {
                reject(err);
            });

            audioProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('Stream do yt-dlp finalizado, concatenando buffer.');
                    resolve(Buffer.concat(chunks));
                } else {
                    reject(new Error(`yt-dlp saiu com o código ${code}`));
                }
            })
        })
    } catch (error) {
        return undefined;
    }
}

export async function webmToMp3(output, buffer) {

    fs.writeFileSync(`${output}.webm`, buffer);

    await new Promise((resolve, reject) => {
        Ffmpeg(`${output}.webm`)
            .toFormat('mp3')
            .audioBitrate(128)
            .save(`${output}.mp3`)
            .on('end', resolve)
            .on('error', reject);
    });

    return fs.readFileSync(`${output}.mp3`);
}

export async function webmToMp4(output, buffer) {

    fs.writeFileSync(`${output}.webm`, buffer);

    await new Promise((resolve, reject) => {
        Ffmpeg(`${output}.webm`)
            .toFormat('mp4')
            .audioBitrate(128)
            .save(`${output}.mp4`)
            .on('end', resolve)
            .on('error', reject);
    });

    return fs.readFileSync(`${output}.mp4`);
}

export function normalizeYouTubeUrl(url) {
    let cleaned = url
        .replace('youtu.be/', 'youtube.com/watch?v=')
        .replace('youtube.com/shorts/', 'youtube.com/watch?v=')
        .trim();

    const match = cleaned.match(/v=([a-zA-Z0-9_-]{11})/);
    return match ? `https://youtube.com/watch?v=${match[1]}` : cleaned;
}

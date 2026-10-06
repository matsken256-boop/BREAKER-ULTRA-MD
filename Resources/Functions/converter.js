const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

async function imageToWebp(media) {
    const tmpFileOut = path.join(__dirname, '../../temp', `${crypto.randomBytes(6).readUIntLE(0, 5).toString(36)}.webp`);
    const tmpFileIn = path.join(__dirname, '../../temp', `${crypto.randomBytes(6).readUIntLE(0, 5).toString(36)}.jpg`);
    
    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${tmpFileIn} -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -p 3 ${tmpFileOut}`, (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

async function videoToWebp(media) {
    const tmpFileOut = path.join(__dirname, '../../temp', `${crypto.randomBytes(6).readUIntLE(0, 5).toString(36)}.webp`);
    const tmpFileIn = path.join(__dirname, '../../temp', `${crypto.randomBytes(6).readUIntLE(0, 5).toString(36)}.mp4`);
    
    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${tmpFileIn} -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -ss 00:00:00.0 -t 00:00:05.0 -p 3 ${tmpFileOut}`, (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

async function writeExif(media, metadata) {
    let wMedia = /webp/.test(media.mimetype) ? media.data : /image/.test(media.mimetype) ? await imageToWebp(media.data) : /video/.test(media.mimetype) ? await videoToWebp(media.data) : "";
    const tmpFileIn = path.join(__dirname, '../../temp', `${crypto.randomBytes(6).readUIntLE(0, 5).toString(36)}.webp`);
    const tmpFileOut = path.join(__dirname, '../../temp', `${crypto.randomBytes(6).readUIntLE(0, 5).toString(36)}.webp`);
    fs.writeFileSync(tmpFileIn, wMedia);

    if (metadata) {
        const { default: { Image } } = await import('node-webpmux');
        const img = new Image();
        await img.load(tmpFileIn);
        img.exif = metadata;
        await img.save(tmpFileOut);
        fs.unlinkSync(tmpFileIn);
        const buff = fs.readFileSync(tmpFileOut);
        fs.unlinkSync(tmpFileOut);
        return buff;
    }
    return wMedia;
}

module.exports = { imageToWebp, videoToWebp, writeExif };
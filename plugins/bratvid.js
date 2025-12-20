// código creado por @WILKER OFC

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

let handler = async (m, { conn, text, usedPrefix, command }) => {
    //Fixieada por ZzawX

    let tempFilePath;
    let tempStickerPath;

    try {
        await m.react('🕒');

        if (!text) {
            await m.react('❔');
            return conn.reply(m.chat, 
                '> `❌ TEXTO FALTANTE`\n\n' +
                '> `📝 Debes escribir texto después del comando`\n\n' +
                '> `💡 Ejemplo:` *' + usedPrefix + command + ' texto aquí*', 
                m
            );
        }

        const tempDir = './temp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        tempFilePath = path.join(tempDir, `brat2_temp_${Date.now()}.mp4`);
        tempStickerPath = path.join(tempDir, `brat2_sticker_${Date.now()}.webp`);

        const username = m.pushName || m.sender.split('@')[0] || "Usuario";

        // APIs a probar
        const apis = [
            {
                name: "ZellAPI",
                url: `https://apizell.web.id/tools/bratanimate?q=${encodeURIComponent(text)}`
            },
            {
                name: "SiputzxAPI", 
                url: `https://api.siputzx.my.id/api/m/bratvideo?text=${encodeURIComponent(text)}`
            },
            {
                name: "MayAPI",
                url: `https://mayapi.ooguy.com/bratvideo`,
                params: { apikey: 'may-051b5d3d', text: text }
            }
        ];

        let mediaBuffer;
        let apiUsed = "Desconocida";
        let isAlreadyWebP = false;

        for (const api of apis) {
            try {
                console.log(`🔄 Probando API: ${api.name}`);

                const response = await axios({
                    method: 'GET',
                    url: api.url,
                    params: api.params || {},
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*'
                    }
                });

                mediaBuffer = Buffer.from(response.data);

                if (!mediaBuffer || mediaBuffer.length < 100) {
                    console.log(`❌ ${api.name}: Datos insuficientes`);
                    continue;
                }

                // Guardar archivo temporal
                fs.writeFileSync(tempFilePath, mediaBuffer);

                // Verificar si ya es WEBP
                const firstBytes = mediaBuffer.slice(0, 12);
                const isWebP = firstBytes.slice(0, 4).toString() === 'RIFF' && 
                              firstBytes.slice(8, 12).toString() === 'WEBP';

                if (isWebP) {
                    console.log(`✅ ${api.name}: Ya es WEBP, usando directamente`);
                    isAlreadyWebP = true;
                    fs.writeFileSync(tempStickerPath, mediaBuffer);
                    apiUsed = api.name;
                    break;
                }

                // Si no es WEBP, convertir a WEBP usando ffmpeg
                console.log(`🔄 ${api.name}: Convirtiendo a WEBP...`);

                // Primero verificar tipo de archivo
                const fileType = await execAsync(`file --brief --mime-type "${tempFilePath}"`);
                console.log(`📁 Tipo de archivo: ${fileType.stdout.trim()}`);

                // Comando ffmpeg para convertir a sticker animado
                const ffmpegCommand = `ffmpeg -i "${tempFilePath}" -vcodec libwebp -filter:v fps=fps=15 -lossless 0 -compression_level 3 -qscale 70 -loop 0 -preset default -an -vsync 0 -s 512:512 "${tempStickerPath}" -y`;

                try {
                    await execAsync(ffmpegCommand, { timeout: 20000 });
                    console.log(`✅ ${api.name}: Conversión exitosa`);
                    apiUsed = api.name;
                    break;
                } catch (ffmpegError) {
                    console.log(`❌ ${api.name}: Error en ffmpeg:`, ffmpegError.message);

                    // Intentar comando más simple
                    const simpleCommand = `ffmpeg -i "${tempFilePath}" -vcodec libwebp -loop 0 -s 512:512 "${tempStickerPath}" -y`;
                    try {
                        await execAsync(simpleCommand, { timeout: 15000 });
                        console.log(`✅ ${api.name}: Conversión simple exitosa`);
                        apiUsed = api.name;
                        break;
                    } catch (simpleError) {
                        console.log(`❌ ${api.name}: Conversión simple también falló`);
                        continue;
                    }
                }

            } catch (apiError) {
                console.log(`❌ ${api.name} falló:`, apiError.message);
                continue;
            }
        }

        if (!apiUsed || !fs.existsSync(tempStickerPath)) {
            throw new Error('No se pudo obtener o convertir el sticker');
        }

        await m.react('✅️');

        console.log(`🎨 Enviando sticker animado desde: ${apiUsed} (${isAlreadyWebP ? 'WEBP directo' : 'convertido'})`);

        // Leer sticker convertido
        const stickerBuffer = fs.readFileSync(tempStickerPath);

        // Verificar que sea WEBP válido
        const firstBytes = stickerBuffer.slice(0, 12);
        const isValidWebP = firstBytes.slice(0, 4).toString() === 'RIFF' && 
                           firstBytes.slice(8, 12).toString() === 'WEBP';

        if (!isValidWebP) {
            throw new Error('El archivo final no es WEBP válido');
        }

        // Enviar sticker
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `Michi wabot`,
                    body: `𝗦𝗼𝗹𝗶𝗰𝗶𝘁𝗮𝗱𝗼 𝗽𝗼𝗿: ${username}\n𝗖𝗿𝗲𝗮𝗱𝗼𝗿: WILKER OFC`,
                    thumbnailUrl: 'https://d.uguu.se/aJRcFFMM.jpeg',
                    sourceUrl: 'https://whatsapp.com/channel/0029Vb6sgWdJkK73qeLU0J0N',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

        // Limpiar archivos temporales después de 10 segundos
        setTimeout(() => {
            try {
                if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                if (tempStickerPath && fs.existsSync(tempStickerPath)) fs.unlinkSync(tempStickerPath);
            } catch (e) {}
        }, 10000);

    } catch (error) {
        console.error('❌ Error en brat2:', error);

        // Limpiar archivos temporales en caso de error
        try {
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            if (tempStickerPath && fs.existsSync(tempStickerPath)) fs.unlinkSync(tempStickerPath);
        } catch (cleanError) {}

        await m.react('❌');

        let errorMessage = '> `❌ ERROR ENCONTRADO`\n\n';

        if (error.message.includes('No se pudo obtener')) {
            errorMessage += '> `📝 Todos los servicios están temporalmente no disponibles. Intenta más tarde.`';
        } else if (error.message.includes('WEBP válido')) {
            errorMessage += '> `📝 Error al procesar el archivo. Intenta con otro texto.`';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += '> `⏰ Tiempo de espera agotado. Intenta de nuevo.`';
        } else if (error.response) {
            errorMessage += '> `📝 Error en la API: ' + error.response.status + '`';
        } else if (error.request) {
            errorMessage += '> `📝 No se pudo conectar con el servicio.`';
        } else if (error.message.includes('ffmpeg')) {
            errorMessage += '> `📝 Error al convertir el video a sticker. Verifica que ffmpeg esté instalado.`';
        } else {
            errorMessage += '> `📝 ' + error.message + '`';
        }

        await conn.reply(m.chat, errorMessage, m);
    }
};

handler.help = ['bratv'];
handler.tags = ['sticker'];
handler.command = ['bratv'];
handler.group = true;

export default handler;
import fetch from 'node-fetch'
import yts from 'yt-search'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import config from '../config.js'

console.log('[INIT] play.js cargado')

const LimitAud = 725 * 1024 * 1024
const LimitVid = 425 * 1024 * 1024
const userRequests = new Set()

console.log('[INIT] Límites definidos', { LimitAud, LimitVid })

const TMP_DIR = './tmp'
console.log('[INIT] TMP_DIR =', TMP_DIR)

if (!fs.existsSync(TMP_DIR)) {
  console.log('[INIT] TMP no existe, creando...')
  fs.mkdirSync(TMP_DIR)
  console.log('[INIT] TMP creado')
} else {
  console.log('[INIT] TMP ya existe')
}

/* ======================
   HELPERS
====================== */
async function getFileSize(url) {
  console.log('[HELPER] getFileSize llamado:', url)
  try {
    const r = await fetch(url, { method: 'HEAD' })
    const size = parseInt(r.headers.get('content-length') || 0)
    console.log('[HELPER] Tamaño detectado:', size)
    return size
  } catch (e) {
    console.log('[HELPER] Error en getFileSize:', e.message)
    return 0
  }
}

const playCommand = {
  name: "play",
  category: "descargas",
  use: "play <nombre o enlace>",
  description: "Busca y descarga audio o video de YouTube.",
  aliases: ['musica', 'play2', 'video', 'play3', 'playdoc', 'play4', 'playdoc2'],

  async execute({ sock, msg, args, commandName }) {
    console.log('[EXECUTE] Comando detectado')
    console.log('[EXECUTE] Sender:', msg.sender)
    console.log('[EXECUTE] Chat:', msg.key.remoteJid)
    console.log('[EXECUTE] Args:', args)
    console.log('[EXECUTE] CommandName:', commandName)

    const text = args.join(' ')
    console.log('[EXECUTE] Texto unido:', text)

    if (!text.trim()) {
      console.log('[VALIDATION] Texto vacío')
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '¿Qué canción quieres escuchar?\nEjemplo: .play In the end' },
        { quoted: msg }
      )
    }

    if (userRequests.has(msg.sender)) {
      console.log('[LOCK] Usuario ya tiene descarga activa')
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '⏳ Ya tienes una descarga en proceso.' },
        { quoted: msg }
      )
    }

    console.log('[LOCK] Registrando usuario en cola')
    userRequests.add(msg.sender)

    try {
      console.log('[STEP] Reaccion 🔍')
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } })

      console.log('[SEARCH] Buscando en YouTube:', text)
      const search = await yts(text)
      console.log('[SEARCH] Resultado completo recibido')

      const video = search.videos[0]
      console.log('[SEARCH] Video seleccionado:', video)

      if (!video) {
        console.log('[ERROR] No se encontró ningún video')
        throw new Error('No se encontraron resultados')
      }

      const isDocument = ['play3', 'playdoc', 'play4', 'playdoc2'].includes(commandName)
      const isAudio = ['play', 'musica', 'play3', 'playdoc'].includes(commandName)

      console.log('[MODE] isAudio:', isAudio)
      console.log('[MODE] isDocument:', isDocument)

      console.log('[SEND] Enviando preview')
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          image: { url: video.image },
          caption: `🎶 Encontrado\n\nTítulo: ${video.title}\nDuración: ${video.timestamp}`
        },
        { quoted: msg }
      )

      /* ======================
         AUDIO
      ====================== */
      if (isAudio) {
        console.log('[AUDIO] Modo audio activado')

        const apiURL = `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(video.url)}`
        console.log('[API] URL construida:', apiURL)

        const apiRes = await axios.get(apiURL)
        console.log('[API] Respuesta completa:', apiRes.data)

        if (!apiRes.data?.status) {
          console.log('[API] status=false')
          throw new Error('API no devolvió status válido')
        }

        const audioURL = apiRes.data.result
        console.log('[API] audioURL:', audioURL)

        const safeTitle = video.title.replace(/[^\w\s]/gi, '').slice(0, 40)
        console.log('[FILE] safeTitle:', safeTitle)

        const rawPath = path.join(TMP_DIR, `${Date.now()}_raw`)
        const mp3Path = path.join(TMP_DIR, `${Date.now()}.mp3`)
        console.log('[FILE] rawPath:', rawPath)
        console.log('[FILE] mp3Path:', mp3Path)

        console.log('[DOWNLOAD] Iniciando fetch audio RAW')
        const res = await fetch(audioURL)

        console.log('[DOWNLOAD] Status fetch:', res.status)

        const stream = fs.createWriteStream(rawPath)
        console.log('[DOWNLOAD] WriteStream creado')

        await new Promise((resolve, reject) => {
          res.body.pipe(stream)
          res.body.on('error', e => {
            console.log('[DOWNLOAD] Error stream:', e.message)
            reject(e)
          })
          stream.on('finish', () => {
            console.log('[DOWNLOAD] Stream finalizado')
            resolve()
          })
        })

        console.log('[FFMPEG] Ejecutando conversión')
        await new Promise((resolve, reject) => {
          exec(
            `ffmpeg -y -i "${rawPath}" -vn -ar 44100 -ac 2 -ab 128k "${mp3Path}"`,
            err => {
              if (err) {
                console.log('[FFMPEG] Error:', err.message)
                reject(err)
              } else {
                console.log('[FFMPEG] Conversión exitosa')
                resolve()
              }
            }
          )
        })

        console.log('[SEND] Enviando audio a WhatsApp')
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            audio: fs.readFileSync(mp3Path),
            mimetype: 'audio/mpeg',
            fileName: `${safeTitle}.mp3`
          },
          { quoted: msg }
        )

        console.log('[CLEANUP] Eliminando raw')
        fs.unlinkSync(rawPath)

        console.log('[CLEANUP] Eliminando mp3')
        fs.unlinkSync(mp3Path)

        console.log('[AUDIO] Proceso de audio finalizado')
      }

      console.log('[SUCCESS] Proceso completado')
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.log('[CATCH] Error atrapado')
      console.log('[CATCH] Mensaje:', err.message)
      console.log('[CATCH] Stack:', err.stack)

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Error: ${err.message}` },
        { quoted: msg }
      )
    } finally {
      console.log('[FINALLY] Eliminando usuario de cola')
      userRequests.delete(msg.sender)
      console.log('[FINALLY] userRequests size:', userRequests.size)
    }
  }
}

console.log('[EXPORT] playCommand exportado')
export default playCommand
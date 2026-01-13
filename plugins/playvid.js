import fetch from 'node-fetch'
import yts from 'yt-search'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

const LimitAud = 725 * 1024 * 1024
const LimitVid = 425 * 1024 * 1024
const userRequests = new Set()
const TMP_DIR = './tmp'

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR)
}

async function getFileSize(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    return parseInt(r.headers.get('content-length') || 0)
  } catch (e) {
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
    const text = args.join(' ')

    if (!text.trim()) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '¿Qué canción quieres escuchar?\nEjemplo: .play In the end' },
        { quoted: msg }
      )
    }

    if (userRequests.has(msg.sender)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '⏳ Ya tienes una descarga en proceso.' },
        { quoted: msg }
      )
    }

    userRequests.add(msg.sender)

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '🔍', key: msg.key } })

      const search = await yts(text)
      const video = search.videos[0]

      if (!video) {
        throw new Error('No se encontraron resultados')
      }

      const isDocument = ['play3', 'playdoc', 'play4', 'playdoc2'].includes(commandName)
      const isAudio = ['play', 'musica', 'play3', 'playdoc'].includes(commandName)

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          image: { url: video.image },
          caption: `🎶 Encontrado\n\nTítulo: ${video.title}\nDuración: ${video.timestamp}`
        },
        { quoted: msg }
      )

      if (isAudio) {
        const apiURL = `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(video.url)}`
        const apiRes = await axios.get(apiURL)

        if (!apiRes.data?.status) {
          throw new Error('API no devolvió status válido')
        }

        const audioURL = apiRes.data.result
        const safeTitle = video.title.replace(/[^\w\s]/gi, '').slice(0, 40)
        const rawPath = path.join(TMP_DIR, `${Date.now()}_raw`)
        const mp3Path = path.join(TMP_DIR, `${Date.now()}.mp3`)

        const res = await fetch(audioURL)
        const stream = fs.createWriteStream(rawPath)

        await new Promise((resolve, reject) => {
          res.body.pipe(stream)
          res.body.on('error', reject)
          stream.on('finish', resolve)
        })

        await new Promise((resolve, reject) => {
          exec(
            `ffmpeg -y -i "${rawPath}" -vn -ar 44100 -ac 2 -ab 128k "${mp3Path}"`,
            err => err ? reject(err) : resolve()
          )
        })

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            audio: fs.readFileSync(mp3Path),
            mimetype: 'audio/mpeg',
            fileName: `${safeTitle}.mp3`
          },
          { quoted: msg }
        )

        fs.unlinkSync(rawPath)
        fs.unlinkSync(mp3Path)
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Error: ${err.message}` },
        { quoted: msg }
      )
    } finally {
      userRequests.delete(msg.sender)
    }
  }
}

export default playCommand
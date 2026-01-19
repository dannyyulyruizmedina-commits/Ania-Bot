import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../lib/message.js'

const isYTUrl = (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url)
async function getVideoInfo(query, videoMatch) {
  const search = await yts(query)
  if (!search.all.length) return null
  const videoInfo = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
  return videoInfo || null
}

export default {
  command: ['play', 'mp3', 'ytmp3', 'ytaudio', 'playaudio'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》Por favor, menciona el nombre o URL del video que deseas descargar')
      }
      const text = args.join(' ')
      const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
      const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text
      let url = query, title = null, thumbBuffer = null
      try {
        const videoInfo = await getVideoInfo(query, videoMatch)
        if (videoInfo) {
          url = videoInfo.url
          title = videoInfo.title
          thumbBuffer = await getBuffer(videoInfo.image)
          const vistas = (videoInfo.views || 0).toLocaleString()
          const canal = videoInfo.author?.name || 'Desconocido'
          const infoMessage = `➩ Descargando › ${title}

> ❖ Canal › *${canal}*
> ⴵ Duración › *${videoInfo.timestamp || 'Desconocido'}*
> ❀ Vistas › *${vistas}*
> ✩ Publicado › *${videoInfo.ago || 'Desconocido'}*
> ❒ Enlace › *${url}*`
          await client.sendMessage(m.chat, { image: thumbBuffer, caption: infoMessage }, { quoted: m })
        }
      } catch (err) {
      }
      const audio = await getAudioFromApi(url)
      if (!audio?.url) {
        return m.reply('《✧》 No se pudo descargar el *audio*, intenta más tarde.')
      }
      const audioBuffer = await getBuffer(audio.url)
      await client.sendMessage(m.chat, { audio: audioBuffer, fileName: `${title || 'audio'}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m })
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  }
}

async function getAudioFromApi(url) {
  const endpoint = `https://api-adonix.ultraplus.click/download/ytaudio?apikey=Mikeywilker1&url=${encodeURIComponent(url)}`
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(endpoint, { signal: controller.signal }).then(r => r.json())
    clearTimeout(timeout)
    
    // Extraer la URL del audio de la respuesta
    const link = res?.data?.url
    if (link) return { url: link, api: 'Adonix' }
  } catch (e) {
    console.error('Error fetching audio from API:', e)
  }
  
  return null
}
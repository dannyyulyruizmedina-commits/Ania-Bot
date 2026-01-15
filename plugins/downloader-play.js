import yts from 'yt-search'

// Configuración
const API_URL = 'https://api-adonix.ultraplus.click/download/ytaudio'
const API_KEY = 'Mikeywilker1' // Tu API key aquí
const MAX_SECONDS = 90 * 60 // 90 minutos máximo
const HTTP_TIMEOUT_MS = 90 * 1000 // 90 segundos timeout

// Configurar globalThis.apikey
globalThis.apikey = API_KEY

function parseDurationToSeconds(d) {
  if (d == null) return null
  if (typeof d === 'number' && Number.isFinite(d)) return Math.max(0, Math.floor(d))
  const s = String(d).trim()
  if (!s) return null
  if (/^\d+$/.test(s)) return Math.max(0, parseInt(s, 10))
  const parts = s.split(':').map((x) => x.trim()).filter(Boolean)
  if (!parts.length || parts.some((p) => !/^\d+$/.test(p))) return null
  let sec = 0
  for (const p of parts) sec = sec * 60 + parseInt(p, 10)
  return Number.isFinite(sec) ? sec : null
}

function formatErr(err, maxLen = 1500) {
  const e = err ?? 'Error desconocido'
  let msg = ''

  if (e instanceof Error) msg = e.stack || `${e.name}: ${e.message}`
  else if (typeof e === 'string') msg = e
  else {
    try {
      msg = JSON.stringify(e, null, 2)
    } catch {
      msg = String(e)
    }
  }

  msg = String(msg || 'Error desconocido').trim()
  if (msg.length > maxLen) msg = msg.slice(0, maxLen) + '\n... (recortado)'
  return msg
}

async function fetchJson(url, timeoutMs = HTTP_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: { 
        accept: 'application/json', 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const text = await res.text().catch(() => '')
    let data = null
    
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    
    if (!res.ok) {
      const msg = data?.message || data?.error || text || `HTTP ${res.status}`
      throw new Error(`HTTP ${res.status}: ${String(msg).slice(0, 400)}`)
    }
    
    if (data == null) throw new Error('Respuesta JSON inválida')
    return data
  } finally {
    clearTimeout(t)
  }
}

async function fetchBuffer(url, timeoutMs = HTTP_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { 
      signal: ctrl.signal, 
      headers: { 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      } 
    })
    
    if (!res.ok) throw new Error(`No se pudo descargar el audio (HTTP ${res.status})`)
    
    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  } finally {
    clearTimeout(t)
  }
}

function guessMimeFromUrl(fileUrl = '') {
  let ext = ''
  try {
    ext = new URL(fileUrl).pathname.split('.').pop() || ''
  } catch {
    ext = String(fileUrl).split('.').pop() || ''
  }
  
  ext = '.' + String(ext).toLowerCase().replace(/[^a-z0-9]/g, '')
  
  if (ext === '.m4a') return 'audio/mp4'
  if (ext === '.opus') return 'audio/ogg; codecs=opus'
  if (ext === '.webm') return 'audio/webm'
  return 'audio/mpeg'
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const chatId = m?.chat || m?.key?.remoteJid
  if (!chatId) return

  // Verificar si hay texto
  if (!text) {
    return conn.sendMessage(
      chatId,
      { 
        text: `🎵 *Descargador de Audio de YouTube*\n\n` +
              `Escribe el nombre o enlace del video.\n\n` +
              `📌 *Ejemplos:*\n` +
              `▸ ${usedPrefix + command} lovely\n` +
              `▸ ${usedPrefix + command} https://youtu.be/...\n` +
              `▸ ${usedPrefix + command} Billie Eilish`
      },
      { quoted: m }
    )
  }

  // Mostrar reacción de espera
  await conn.sendMessage(chatId, { react: { text: '⏳', key: m.key } }).catch(() => {})

  let ytUrl = text.trim()
  let ytInfo = null

  try {
    // Buscar en YouTube si no es un enlace directo
    if (!/youtu\.be|youtube\.com|y2u\.be|yt\.be/i.test(ytUrl)) {
      const search = await yts(ytUrl)
      const first = search?.videos?.[0]
      
      if (!first) {
        await conn.sendMessage(
          chatId, 
          { text: '❌ No se encontraron resultados para tu búsqueda.' }, 
          { quoted: m }
        )
        return
      }
      
      ytInfo = first
      ytUrl = first.url
    } else {
      // Si es un enlace directo, obtener información
      const search = await yts({ query: ytUrl, pages: 1 })
      if (search?.videos?.length) {
        ytInfo = search.videos[0]
      }
    }
  } catch (e) {
    await conn.sendMessage(
      chatId,
      { 
        text: `❌ *Error en la búsqueda*\n\n` +
              `No se pudo buscar en YouTube.\n\n` +
              `🔧 *Detalles:*\n\`\`\`${formatErr(e, 1000)}\`\`\``
      },
      { quoted: m }
    )
    return
  }

  // Verificar duración
  const durSec =
    parseDurationToSeconds(ytInfo?.duration?.seconds) ??
    parseDurationToSeconds(ytInfo?.seconds) ??
    parseDurationToSeconds(ytInfo?.duration) ??
    parseDurationToSeconds(ytInfo?.timestamp)

  if (durSec && durSec > MAX_SECONDS) {
    await conn.sendMessage(
      chatId,
      { 
        text: `⏱️ *Video demasiado largo*\n\n` +
              `Este video dura más de ${Math.floor(MAX_SECONDS / 60)} minutos.\n` +
              `Máximo permitido: *${Math.floor(MAX_SECONDS / 60)} minutos*`
      },
      { quoted: m }
    )
    return
  }

  // Información del video
  const title = ytInfo?.title || 'Audio de YouTube'
  const author = ytInfo?.author?.name || ytInfo?.author || 'Desconocido'
  const duration = ytInfo?.timestamp || 'Desconocida'
  const thumbnail = ytInfo?.thumbnail
  const views = ytInfo?.views ? parseInt(ytInfo.views).toLocaleString() : 'N/A'

  const caption =
    `🎵 *PROCESANDO AUDIO*\n\n` +
    `📌 *Título:* ${title}\n` +
    `👤 *Canal:* ${author}\n` +
    `⏱️ *Duración:* ${duration}\n` +
    `👁️ *Vistas:* ${views}\n` +
    `🔗 *Enlace:* ${ytUrl}\n\n` +
    `_Descargando audio..._`

  // Enviar información del video
  try {
    if (thumbnail) {
      await conn.sendMessage(chatId, { 
        image: { url: thumbnail }, 
        caption: caption 
      }, { quoted: m })
    } else {
      await conn.sendMessage(chatId, { text: caption }, { quoted: m })
    }
  } catch {}

  // Usar la API para descargar audio
  try {
    const apiUrl = `${API_URL}?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(ytUrl)}`
    
    const apiResp = await fetchJson(apiUrl, HTTP_TIMEOUT_MS)
    
    if (!apiResp?.status || !apiResp?.data?.url) {
      throw new Error('La API no devolvió un enlace de descarga válido')
    }

    const directUrl = String(apiResp.data.url)
    const apiTitle = apiResp?.data?.title || title

    // Descargar y enviar audio
    const audioBuffer = await fetchBuffer(directUrl, HTTP_TIMEOUT_MS)
    const mime = guessMimeFromUrl(directUrl)
    
    await conn.sendMessage(
      chatId,
      {
        audio: audioBuffer,
        mimetype: mime,
        fileName: `${apiTitle.replace(/[^\w\s]/gi, '')}.mp3`.substring(0, 100),
        contextInfo: {
          externalAdReply: {
            title: `🎧 ${apiTitle.substring(0, 50)}`,
            body: `Canal: ${author}`,
            thumbnailUrl: thumbnail,
            mediaType: 2,
            mediaUrl: ytUrl,
            sourceUrl: ytUrl
          }
        }
      },
      { quoted: m }
    )

    // Reacción de éxito
    await conn.sendMessage(chatId, { react: { text: '✅', key: m.key } }).catch(() => {})

  } catch (e) {
    await conn.sendMessage(
      chatId,
      { 
        text: `❌ *Error al descargar el audio*\n\n` +
              `No se pudo obtener el audio del video.\n\n` +
              `🔧 *Detalles:*\n\`\`\`${formatErr(e, 1000)}\`\`\``
      },
      { quoted: m }
    )
  }
}

// Configuración del comando
handler.help = ['play <texto|enlace>']
handler.tags = ['multimedia', 'descargas']
handler.command = ['play', 'ytplay', 'ytmp3', 'audio']
handler.limit = true
handler.premium = false

export default handler
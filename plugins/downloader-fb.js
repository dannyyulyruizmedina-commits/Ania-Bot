import axios from "axios"

const API_BASE = "https://api-adonix.ultraplus.click/download/facebook?apikey=Adofreekey&url="

function isValidUrl(u = "") {
  try {
    const url = new URL(u)
    return /^https?:$/.test(url.protocol)
  } catch {
    return false
  }
}

function isFacebookUrl(u = "") {
  return /(?:facebook\.com|fb\.watch)/i.test(u)
}

function formatUnixSeconds(sec) {
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return "N/A"
  const d = new Date(n * 1000)
  if (Number.isNaN(d.getTime())) return "N/A"
  return d.toLocaleString()
}

function formatDuration(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return "N/A"

  const ms = n >= 1000 && n < 60 * 60 * 1000 ? n : null
  const seconds = ms ? Math.round(ms / 1000) : (n < 60 * 60 * 24 ? n : null)

  const totalSec = seconds ?? (Number.isFinite(n) ? n : null)
  if (!totalSec || totalSec <= 0) return String(n)

  const s = Math.floor(totalSec % 60)
  const m = Math.floor((totalSec / 60) % 60)
  const h = Math.floor(totalSec / 3600)

  const hh = h ? `${h}h ` : ""
  const mm = m ? `${m}m ` : ""
  const ss = `${s}s`

  return ms ? `${hh}${mm}${ss} (aprox, desde ${n}ms)` : `${hh}${mm}${ss}`
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const chatId = m?.chat || m?.key?.remoteJid
  if (!chatId) return

  const url = (text || "").trim()

  if (!url || !isValidUrl(url) || !isFacebookUrl(url)) {
    return await conn.sendMessage(
      chatId,
      {
        text:
          `「✦」Uso correcto:\n` +
          `> ✐ ${usedPrefix + command} <link-facebook>\n\n` +
          `「✦」Ejemplo:\n` +
          `> ✐ ${usedPrefix + command} https://www.facebook.com/reel/1230818705820254/`
      },
      { quoted: m }
    )
  }

  const apiUrl = API_BASE + encodeURIComponent(url)

  try {
    await conn.sendMessage(chatId, { react: { text: "🕒", key: m.key } })

    const { data } = await axios.get(apiUrl, {
      timeout: 60000,
      headers: { "User-Agent": "Mozilla/5.0" }
    })

    if (!data || data.status !== true || !data.result) {
      throw new Error("Respuesta inválida de la API.")
    }

    const info = data.result?.info || {}
    const author = data.result?.author || {}
    const media = data.result?.media || {}

    const videoHD = media?.video_hd || ""
    const videoSD = media?.video_sd || ""
    const videoUrl = videoHD || videoSD

    if (!videoUrl || !isValidUrl(videoUrl)) {
      throw new Error("No se encontró un enlace de video válido (HD/SD).")
    }

    const caption =
      `「✦」 *Facebook Downloader*\n\n` +
      `≡ *Título:* ${info?.title ?? "N/A"}\n` +
      `≡ *Link:* ${info?.permalink_url ?? url}\n` +
      `≡ *Creación:* ${formatUnixSeconds(info?.creation_time)}\n` +
      `≡ *Duración:* ${formatDuration(info?.duration)}\n\n`

    await conn.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption
      },
      { quoted: m }
    )

    await conn.sendMessage(chatId, { react: { text: "✔️", key: m.key } })
  } catch (e) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: m.key } })
    const msg = String(e?.message || e || "Error desconocido.")
    return await conn.sendMessage(chatId, { text: `「✦」Error: ${msg}` }, { quoted: m })
  }
}

handler.help = ["facebook <url>", "fb <url>", "fbdl <url>"]
handler.tags = ["downloader"]
handler.command = ["facebook", "fb"]

export default handler
import fs from 'fs'
import { join } from 'path'
import { xpRange } from '../lib/levelling.js'

// Categorías con temática Ania Bot kawaii 🌸💗
const tags = {
  Subbots: '🌸 SUBBOTS',
  eco: '💗 JUEGO RPG',
  descargas: '🌀 DESCARGAS',
  tools: '✨ HERRAMIENTAS',
  owner: '👑 OWNER',
  info: 'ℹ️ INFORMACIÓN',
  game: '🎮 ENTRENAMIENTO',
  gacha: '🎲 ECO ANIA',
  reacciones: '💕 REACCIONES',
  group: '👥 GRUPO ANIA',
  search: '🔎 BUSCADOR',
  sticker: '📌 STICKERS',
  ia: '🤖 INTELIGENCIA',
  channel: '📺 HOUSE ANIA',
  fun: '😂 DIVERSIÓN',
  beast: '💫 COMANDOS'
}

// Menú kawaii con diseño Ania Bot 🌸💗
const defaultMenu = {
  before: `
╔════════════════════╗
║🌸 ANIA BOT MODE 💗 ║
╠════════════════════╣
║ Hola~ soy %botname (◕ᴗ◕✿)
║ *%name*, %greeting
║ 
║ 🌸 *Tipo:* %tipo
║ 💗 *Nivel Ania:* *100%*
║ 📅 *Fecha:* %date
║ ⏱️ *Activo:* %uptime
╠════════════════════╣
║    💫 𝙲𝙾𝙼𝙰𝙽𝙳𝙾𝚂 ANIA       
%readmore
`.trimStart(),

  header: '\n╠═ %category ═╣\n',
  body: '║ 💫 *%cmd* %islimit %isPremium',
  footer: '',
  after: `
╠════════════════╣
║🌸 *ANIA BOT* 💗
║✨ Creado por YULY~ (◕‿◕✿)
║💗 Base: HOUSE ANIA
║💫 Domina el chat con estilo!
╚════════════════╝

*¡Que la magia de ANIA te acompañe!* 🌸✨💗
`.trim(),
}

const handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    // Datos del usuario 🌸
    const { exp, limit, level } = global.db.data.users[m.sender]
    const { min, xp, max } = xpRange(level, global.multiplier)
    const name = await conn.getName(m.sender)

    // Fecha kawaii 🌸
    const d = new Date(Date.now() + 3600000)
    const date = d.toLocaleDateString('es', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    })

    // Obtener comandos disponibles
    const help = Object.values(global.plugins)
      .filter(p => !p.disabled)
      .map(p => ({
        help: Array.isArray(p.help) ? p.help : [p.help],
        tags: Array.isArray(p.tags) ? p.tags : [p.tags],
        prefix: 'customPrefix' in p,
        limit: p.limit,
        premium: p.premium,
      }))

    // Nombre del bot siempre "ANIA BOT" 🌸💗
    let nombreBot = 'ANIA BOT'
    // Imagen de Ania Bot
    let bannerFinal = 'https://i.ibb.co/vx8pBD5Z/tourl-1769880807867.jpg'

    // Intentar leer configuración personalizada
    const botActual = conn.user?.jid?.split('@')[0].replace(/\D/g, '')
    const configPath = join('./JadiBots', botActual, 'config.json')

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath))
        if (config.name) nombreBot = config.name
        if (config.banner) bannerFinal = config.banner
      } catch (e) {
        console.error('🌸 Error leyendo config:', e)
      }
    }

    const tipo = conn.user.jid === global.conn.user.jid ? '🌸 PRINCIPAL' : '💗 SUB-BOT'
    const menuConfig = conn.menu || defaultMenu

    // Generar texto del menú kawaii
    const _text = [
      menuConfig.before,
      ...Object.keys(tags).map(tag => {
        const cmds = help
          .filter(menu => menu.tags?.includes(tag))
          .map(menu => menu.help.map(h => 
            menuConfig.body
              .replace(/%cmd/g, menu.prefix ? h : `${_p}${h}`)
              .replace(/%islimit/g, menu.limit ? '🔒' : '')
              .replace(/%isPremium/g, menu.premium ? '💎' : '🌸')
          ).join('\n')).join('\n')
        return cmds ? [menuConfig.header.replace(/%category/g, tags[tag]), cmds, menuConfig.footer].join('\n') : ''
      }).filter(Boolean),
      menuConfig.after
    ].join('\n')

    // Reemplazos dinámicos 🌸
    const replace = {
      '%': '%',
      p: _p,
      botname: nombreBot,
      taguser: '@' + m.sender.split('@')[0],
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      level,
      limit,
      name,
      date,
      uptime: clockString(process.uptime() * 1000),
      tipo,
      readmore: readMore,
      greeting: getAniaGreeting(),
    }

    // Aplicar reemplazos 💗
    const text = _text.replace(
      new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join('|')})`, 'g'),
      (_, name) => String(replace[name])
    )

    // Preparar imagen kawaii
    let imageContent
    try {
      imageContent = { image: { url: bannerFinal } }
    } catch {
      // Fallback si la imagen falla
      imageContent = {}
    }

    // Botones kawaii (◕ᴗ◕✿) 🌸💗
    const buttons = [
      { 
        buttonId: '.canal', 
        buttonText: { displayText: '🌸 HOUSE ANIA' }, 
        type: 1 
      },
      { 
        buttonId: '.ping', 
        buttonText: { displayText: '💗 PING' }, 
        type: 1 
      },
      { 
        buttonId: '.code', 
        buttonText: { displayText: '✨ SUBBOT' }, 
        type: 1 
      }
    ]

    // Enviar mensaje con menú kawaii
    await conn.sendMessage(
      m.chat,
      { 
        ...imageContent, 
        caption: text.trim(), 
        footer: '🌸 *ANIA BOT* - ¡Comandos con magia! 💗', 
        buttons, 
        headerType: 4, 
        mentionedJid: conn.parseMention(text),
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: '🌸 ANIA BOT ACTIVADA 💗',
            body: '¡Menú de comandos kawaii!',
            mediaType: 1,
            thumbnailUrl: bannerFinal,
            sourceUrl: 'https://whatsapp.com/channel/0029Vb724SDHltY4qGU9QS3S'
          }
        }
      },
      { quoted: m }
    )

    // Reacciones kawaii 🌸💗
    await m.react('🌸')
    setTimeout(() => m.react('💗'), 500)
    setTimeout(() => m.react('✨'), 1000)

  } catch (e) {
    console.error('💗 Error en el menú kawaii:', e)
    await conn.reply(m.chat, 
`🌸 *¡Ups! Algo salió mal~* (´•̥̥̥ω•̥̥̥\`)

El menú Ania no pudo cargarse...
💗 *Causa:* Magia insuficiente
🌸 *Solución:* Intenta de nuevo~

*Mientras usa:* ${_p}help simple`, 
      m
    )
  }
}

// Comandos y configuración kawaii
handler.command = ['menu', 'help', 'menú', 'ayuda', 'comandos', 'menuania', 'aniabot']
handler.tags = ['ania', 'main', 'menu']
handler.help = ['menu',]
handler.register = false
handler.limit = false

export default handler

// ============================================
// FUNCIONES AUXILIARES KAWAI 🌸💗
// ============================================

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

function getAniaGreeting() {
  const hour = new Date().getHours()
  const greetings = {
    0: 'una noche mágica llena de estrellas 🌙✨',
    1: 'una noche de sueños kawaii 💤🌸',
    2: 'una noche llena de magia 💫💗',
    3: 'un amanecer de hadas 🌅🦋',
    4: 'un amanecer de meditación zen 🧘🌸',
    5: 'un amanecer con aroma a flores 🌸🌅',
    6: 'una mañana de risas y alegría ☀️💕',
    7: 'una mañana en el jardín secreto 🌷🏰',
    8: 'una mañana de aventuras mágicas 🎀✨',
    9: 'una mañana en el café kawaii ☕🌸',
    10: 'un día lleno de brillo y color ✨🎨',
    11: 'un día de picnic con amigos 🧺💗',
    12: 'un día soleado de diversión 🌞🎈',
    13: 'una tarde de manualidades y arte 🎀🖌️',
    14: 'una tarde en la biblioteca mágica 📚✨',
    15: 'una tarde de té y galletas 🍵🍪',
    16: 'una tarde de películas kawaii 🎬🌸',
    17: 'un atardecer de paseo por el parque 🌇🌳',
    18: 'una noche de juegos y risas 🎮😂',
    19: 'una noche viendo las estrellas fugaces 🌠💫',
    20: 'una noche de cuentos de hadas 🧚📖',
    21: 'una noche preparando cupcakes 🧁💗',
    22: 'una noche protegiendo sueños 🌙🛡️',
    23: 'una noche de vigilia Ania bot 🌃🌸',
  }
  return 'Espero que tengas ' + (greetings[hour] || 'un día increíble lleno de magia~ 🌸✨💗')
}

// Función para nivel de magia Ania 🌸💗
function getAniaLevel(level) {
  if (level < 10) return '👶 Principiante Ania'
  if (level < 30) return '🌸 Aprendiz Ania'
  if (level < 50) return '💗 Ania Intermedia'
  if (level < 80) return '✨ Ania Avanzada'
  if (level < 100) return '💫 Ania Experta'
  if (level < 150) return '🌀 Ania Mágica'
  if (level < 200) return '💎 Ania Diamante'
  if (level < 300) return '👑 Reina Ania'
  return '🌸💗 ANIA BOT SUPREMA'
}

// Alias kawaii para el handler
handler.alias = ['menuu', 'ayudame', 'comanditos', 'aniahelpp']
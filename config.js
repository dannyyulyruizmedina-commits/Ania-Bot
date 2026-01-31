import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// 👑 Dueños del bot
global.owner = [
  ['573105375475', 'yuly', true],
  ['5492644893953','wilker', true],
  ['573245517485', 'ania', true],
  ['595972314588', 'soporte', true]
]

global.mods = []      // Moderadores
global.prems = []     // Usuarios premium

// 🌸 APIs Configuration
global.APIs = {
  xyro: { 
    url: "https://api.xyro.site", 
    key: null 
  },
  yupra: { 
    url: "https://api.yupra.my.id", 
    key: null 
  },
  vreden: { 
    url: "https://api.vreden.web.id", 
    key: null 
  },
  delirius: { 
    url: "https://api.delirius.store", 
    key: null 
  },
  zenzxz: { 
    url: "https://api.zenzxz.my.id", 
    key: null 
  },
  siputzx: { 
    url: "https://api.siputzx.my.id", 
    key: null 
  },
  adonix: { 
    url: "https://api-adonix.ultraplus.click", 
    key: 'AdonixKey4vqkxt2009' 
  },
  ania: {
    url: "https://api-ania.vercel.app",
    key: "ania_kawaii_2025"
  }
}

// 🎀 ANIA BOT Identity
global.namebot = '🌸 ANIA BOT 💗'
global.packname = '🌸 Ania Bot • Modo Kawaii 💗'
global.author = 'Yuly & Wilker | © 2025 🌸'
global.moneda = 'Flores 🌸'

// ⚙️ Technical Configuration
global.libreria = 'Baileys'
global.baileys = 'V 6.7.16'
global.vs = '3.0.0'
global.sessions = 'Sessions'
global.jadi = 'AniaBots'
global.yukiJadibts = true

// 📺 Channel Information - HOUSE ANIA
global.namecanal = '🌸 HOUSE ANIA 💗'
global.idcanal = '120363403739366547@newsletter'
global.idcanal2 = '120363403739366547@newsletter'
global.canal = 'https://whatsapp.com/channel/0029Vb724SDHltY4qGU9QS3S'
global.canalreg = '120363402895449162@newsletter'

global.ch = {
  ch1: '120363420941524030@newsletter',  // Canal principal
  ch2: '120363418827369713@newsletter'   // Canal secundario
}

// 🎮 Bot Settings
global.multiplier = 100  // Experiencia más rápida
global.maxwarn = 3       // Advertencias antes de ban
global.limitawal = {     // Límites iniciales
  premium: 1000,
  free: 50,
  mods: 5000
}

// 🌟 Theme Settings
global.theme = {
  name: 'Ania Kawaii',
  version: '2.0.0',
  emoji: '🌸💗✨',
  color: '#FF9EBD'
}

// 🤖 Auto-reply settings
global.autoRead = true      // Leer mensajes automáticamente
global.autoTyping = true    // Escribiendo...
global.autoRecording = true // Grabando audio...

// 📊 Database default
global.db = {
  chats: {},
  users: {},
  groups: {},
  settings: {
    welcome: true,
    antilink: false,
    antispam: true,
    autosticker: true
  }
}

// 🎵 Status messages
global.status = [
  { type: 'Playing', message: '🌸 Modo Kawaii' },
  { type: 'Listening', message: '💗 House Ania' },
  { type: 'Watching', message: '✨ Comandos mágicos' }
]

// ⚡ File Watch for Auto-reload
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.hex('#FF9EBD')("🌸 Se actualizó 'config.js' - ANIA BOT REINICIADA 💗"))
  import(`file://${file}?update=${Date.now()}`)
})

// 🎉 Initial message
console.log(chalk.hex('#FF9EBD')(`
╔══════════════════════╗
║    🌸 ANIA BOT 💗     ║
╠══════════════════════╣
║ Versión: ${global.vs}
║ Baileys: ${global.baileys}
║ Dueños: Yuly & Wilker
║ Estado: ✅ ACTIVA
╚══════════════════════╝
`))
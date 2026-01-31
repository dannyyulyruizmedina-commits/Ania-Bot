import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
  ['573105375475', 'yuly', true],
  ['5492644893953','wilker', true],
  ['156981591593126'],
  ['595972314588']
]

global.mods = []
global.prems = []

// APIs Configuration
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
  }
}


global.namebot = 'michi wabot 🧃'
global.packname = 'michi-wa-bot 🥞'
global.author = 'wilker | © 2025 🪸'
global.moneda = 'Mangos'

// Technical Configuration
global.libreria = 'Baileys'
global.baileys = 'V 6.7.16'
global.vs = '2.2.0'
global.sessions = 'Sessions'
global.jadi = 'JadiBots'
global.yukiJadibts = true

// Channel Information
global.namecanal = '❇️'
global.idcanal = '120363403739366547@newsletter'
global.idcanal2 = '120363403739366547@newsletter'
global.canal = 'https://whatsapp.com/channel/0029Vb5pM031CYoMvQi2I02D'
global.canalreg = '120363402895449162@newsletter'

global.ch = {
  ch1: '120363420941524030@newsletter'
}

// Bot Settings
global.multiplier = 69
global.maxwarn = 2

// File Watch for Auto-reload
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("🔄 Se actualizó 'config.js'"))
  import(`file://${file}?update=${Date.now()}`)
})
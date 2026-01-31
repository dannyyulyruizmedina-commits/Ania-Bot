import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const welcomePath = path.join(__dirname, 'database', 'welcome.json')

// Crear archivo si no existe
if (!fs.existsSync(welcomePath)) {
  const defaultWelcome = {
    groups: {},
    default: {
      welcome: {
        text: "🌸 *¡BIENVENID@ AL GRUPO!* 💗\n\n🎀 *Usuario:* @user\n🌸 *Grupo:* %subject\n💗 *Participantes:* %members\n✨ *Disfruta tu estadía!*",
        image: "https://i.ibb.co/vx8pBD5Z/tourl-1769880807867.jpg"
      },
      bye: {
        text: "💔 *¡HASTA PRONTO!* 🌸\n\n🎀 *Usuario:* @user\n🌸 *Ya no está en:* %subject\n💗 *Motivo:* Se fue voluntariamente\n✨ *Que te vaya bien!*",
        image: "https://i.ibb.co/vx8pBD5Z/tourl-1769880807867.jpg"
      }
    }
  }
  
  // Crear carpeta database si no existe
  if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'), { recursive: true })
  }
  
  fs.writeFileSync(welcomePath, JSON.stringify(defaultWelcome, null, 2))
}

// Leer configuración
function readWelcome() {
  try {
    return JSON.parse(fs.readFileSync(welcomePath))
  } catch (e) {
    console.error('Error leyendo welcome.json:', e)
    return { groups: {}, default: {} }
  }
}

// Guardar configuración
function saveWelcome(data) {
  try {
    fs.writeFileSync(welcomePath, JSON.stringify(data, null, 2))
    return true
  } catch (e) {
    console.error('Error guardando welcome.json:', e)
    return false
  }
}

const handler = async (m, { conn, text, command, participants, groupMetadata, isAdmin, isBotAdmin }) => {
  const welcomeData = readWelcome()
  const groupId = m.chat
  const args = text.trim().split(' ')
  const subcmd = args[0]?.toLowerCase()
  
  // Verificar que sea grupo
  if (!m.isGroup) {
    return m.reply('🌸 *Este comando solo funciona en grupos, mi ciel@* 💗')
  }
  
  // Verificar permisos de administrador
  if (!isAdmin && !global.owner.map(v => v[0]).includes(m.sender.split('@')[0])) {
    return m.reply('💔 *Solo los administradores pueden configurar las bienvenidas* 🌸')
  }
  
  // Verificar que el bot sea admin
  if (!isBotAdmin) {
    return m.reply('🌸 *Necesito ser administradora para poder dar la bienvenida* 💗')
  }
  
  switch (command) {
    
    // ============================================
    // 🎀 COMANDO SETWELCOME
    // ============================================
    case 'setwelcome':
      if (!subcmd) {
        return m.reply(`🌸 *Uso incorrecto* 💗

🎀 *Para establecer texto:*
.setwelcome text [tu mensaje]
Ejemplo: .setwelcome text ¡Hola @user! Bienvenid@ a %subject 🌸

💗 *Para establecer imagen:*
.setwelcome image [URL de la imagen]
Ejemplo: .setwelcome image https://ejemplo.com/foto.jpg

✨ *Variables disponibles:*
@user → Menciona al usuario
%subject → Nombre del grupo
%members → Cantidad de miembros
%desc → Descripción del grupo
%owner → Dueño del grupo
%botname → Nombre del bot

🌸 *Ver configuración actual:*
.setwelcome view
.setwelcome reset (restablecer)`)
      }
      
      switch (subcmd) {
        case 'text':
          const welcomeText = args.slice(1).join(' ')
          if (!welcomeText) {
            return m.reply('🌸 *Por favor escribe el texto de bienvenida* 💗')
          }
          
          if (!welcomeData.groups[groupId]) {
            welcomeData.groups[groupId] = { welcome: {}, bye: {} }
          }
          
          welcomeData.groups[groupId].welcome.text = welcomeText
          saveWelcome(welcomeData)
          
          await m.reply(`✅ *Texto de bienvenida actualizado* 🌸\n\n${welcomeText}`)
          break
          
        case 'image':
          const imageUrl = args[1]
          if (!imageUrl || !imageUrl.startsWith('http')) {
            return m.reply('🌸 *Por favor envía una URL válida de imagen* 💗\nEjemplo: .setwelcome image https://i.imgur.com/foto.jpg')
          }
          
          if (!welcomeData.groups[groupId]) {
            welcomeData.groups[groupId] = { welcome: {}, bye: {} }
          }
          
          welcomeData.groups[groupId].welcome.image = imageUrl
          saveWelcome(welcomeData)
          
          await m.reply(`✅ *Imagen de bienvenida actualizada* 💗\nURL: ${imageUrl}`)
          break
          
        case 'view':
          const currentWelcome = welcomeData.groups[groupId]?.welcome || welcomeData.default.welcome
          const welcomeView = `
🌸 *CONFIGURACIÓN DE BIENVENIDA* 💗

🎀 *Texto:*
${currentWelcome.text || 'No configurado'}

💗 *Imagen:*
${currentWelcome.image || 'Usando imagen por defecto'}

✨ *Estado:* ${welcomeData.groups[groupId]?.welcome ? '✅ Personalizado' : '🔄 Por defecto'}
`
          await conn.sendMessage(m.chat, {
            text: welcomeView,
            contextInfo: {
              mentionedJid: [m.sender]
            }
          }, { quoted: m })
          break
          
        case 'reset':
          if (welcomeData.groups[groupId]) {
            delete welcomeData.groups[groupId].welcome
            if (Object.keys(welcomeData.groups[groupId]).length === 0) {
              delete welcomeData.groups[groupId]
            }
            saveWelcome(welcomeData)
          }
          await m.reply('🌸 *Configuración de bienvenida restablecida a los valores por defecto* 💗')
          break
          
        default:
          await m.reply('🌸 *Subcomando no reconocido* 💗\nUsa: text, image, view o reset')
      }
      break
    
    // ============================================
    // 💔 COMANDO SETBYE
    // ============================================
    case 'setbye':
      if (!subcmd) {
        return m.reply(`🌸 *Uso incorrecto* 💗

🎀 *Para establecer texto:*
.setbye text [tu mensaje]
Ejemplo: .setbye text @user se ha ido del grupo %subject 💔

💗 *Para establecer imagen:*
.setbye image [URL de la imagen]
Ejemplo: .setbye image https://ejemplo.com/despedida.jpg

✨ *Variables disponibles:*
@user → Menciona al usuario
%subject → Nombre del grupo
%members → Cantidad de miembros restantes
%reason → Razón de la salida

🌸 *Ver configuración actual:*
.setbye view
.setbye reset (restablecer)`)
      }
      
      switch (subcmd) {
        case 'text':
          const byeText = args.slice(1).join(' ')
          if (!byeText) {
            return m.reply('🌸 *Por favor escribe el texto de despedida* 💗')
          }
          
          if (!welcomeData.groups[groupId]) {
            welcomeData.groups[groupId] = { welcome: {}, bye: {} }
          }
          
          welcomeData.groups[groupId].bye.text = byeText
          saveWelcome(welcomeData)
          
          await m.reply(`✅ *Texto de despedida actualizado* 💔\n\n${byeText}`)
          break
          
        case 'image':
          const byeImageUrl = args[1]
          if (!byeImageUrl || !byeImageUrl.startsWith('http')) {
            return m.reply('🌸 *Por favor envía una URL válida de imagen* 💗\nEjemplo: .setbye image https://i.imgur.com/foto.jpg')
          }
          
          if (!welcomeData.groups[groupId]) {
            welcomeData.groups[groupId] = { welcome: {}, bye: {} }
          }
          
          welcomeData.groups[groupId].bye.image = byeImageUrl
          saveWelcome(welcomeData)
          
          await m.reply(`✅ *Imagen de despedida actualizada* 💗\nURL: ${byeImageUrl}`)
          break
          
        case 'view':
          const currentBye = welcomeData.groups[groupId]?.bye || welcomeData.default.bye
          const byeView = `
💔 *CONFIGURACIÓN DE DESPEDIDA* 🌸

🎀 *Texto:*
${currentBye.text || 'No configurado'}

💗 *Imagen:*
${currentBye.image || 'Usando imagen por defecto'}

✨ *Estado:* ${welcomeData.groups[groupId]?.bye ? '✅ Personalizado' : '🔄 Por defecto'}
`
          await conn.sendMessage(m.chat, {
            text: byeView,
            contextInfo: {
              mentionedJid: [m.sender]
            }
          }, { quoted: m })
          break
          
        case 'reset':
          if (welcomeData.groups[groupId]) {
            delete welcomeData.groups[groupId].bye
            if (Object.keys(welcomeData.groups[groupId]).length === 0) {
              delete welcomeData.groups[groupId]
            }
            saveWelcome(welcomeData)
          }
          await m.reply('🌸 *Configuración de despedida restablecida a los valores por defecto* 💗')
          break
          
        default:
          await m.reply('🌸 *Subcomando no reconocido* 💗\nUsa: text, image, view o reset')
      }
      break
    
    // ============================================
    // ✨ COMANDO TESTWELCOME/TESTBYE
    // ============================================
    case 'testwelcome':
    case 'testbye':
      const isWelcome = command === 'testwelcome'
      const type = isWelcome ? 'welcome' : 'bye'
      const config = welcomeData.groups[groupId]?.[type] || welcomeData.default[type]
      
      if (!config.text) {
        return m.reply(`🌸 *No hay ${isWelcome ? 'bienvenida' : 'despedida'} configurada para este grupo* 💗`)
      }
      
      // Simular usuario
      const user = m.sender
      const username = await conn.getName(user)
      const groupName = groupMetadata.subject || 'Este grupo'
      const memberCount = participants.length
      const desc = groupMetadata.desc || 'Sin descripción'
      const owner = groupMetadata.owner || 'Desconocido'
      
      // Reemplazar variables
      let message = config.text
        .replace(/@user/g, `@${user.split('@')[0]}`)
        .replace(/%subject/g, groupName)
        .replace(/%members/g, memberCount)
        .replace(/%desc/g, desc)
        .replace(/%owner/g, owner)
        .replace(/%botname/g, global.namebot)
      
      const mentionedJid = [user]
      
      // Enviar mensaje de prueba
      const msgOptions = {
        text: message,
        contextInfo: {
          mentionedJid: mentionedJid,
          forwardingScore: 999,
          isForwarded: true
        }
      }
      
      // Añadir imagen si existe
      if (config.image) {
        msgOptions.image = { url: config.image }
        msgOptions.caption = message
      }
      
      await conn.sendMessage(m.chat, msgOptions, { quoted: m })
      await m.reply(`✅ *${isWelcome ? 'Bienvenida' : 'Despedida'} de prueba enviada* ${isWelcome ? '🌸' : '💔'}`)
      break
    
    // ============================================
    // 📊 COMANDO WELSETTINGS
    // ============================================
    case 'welsettings':
    case 'configwel':
      const groupConfig = welcomeData.groups[groupId] || {}
      const welcomeConfig = groupConfig.welcome || welcomeData.default.welcome
      const byeConfig = groupConfig.bye || welcomeData.default.bye
      
      const settingsText = `
🌸 *CONFIGURACIÓN GRUPO: ${groupMetadata.subject}* 💗

🎀 *BIENVENIDA:*
✅ Activada: ${welcomeData.groups[groupId]?.welcome ? 'Sí' : 'No (usando default)'}
📝 Texto: ${welcomeConfig.text ? '✅ Configurado' : '❌ No configurado'}
🖼️ Imagen: ${welcomeConfig.image ? '✅ Configurada' : '❌ No configurada'}

💔 *DESPEDIDA:*
✅ Activada: ${welcomeData.groups[groupId]?.bye ? 'Sí' : 'No (usando default)'}
📝 Texto: ${byeConfig.text ? '✅ Configurado' : '❌ No configurado'}
🖼️ Imagen: ${byeConfig.image ? '✅ Configurada' : '❌ No configurada'}

✨ *COMANDOS:*
.setwelcome text/imagen/view/reset
.setbye text/imagen/view/reset
.testwelcome / .testbye
`
      await conn.sendMessage(m.chat, {
        text: settingsText,
        contextInfo: {
          mentionedJid: [m.sender]
        }
      }, { quoted: m })
      break
  }
}

// Handler para eventos reales de bienvenida/despedida
export async function groupUpdate(conn, update) {
  try {
    const welcomeData = readWelcome()
    
    // Detectar cuando alguien se une
    if (update.action === 'add') {
      const participants = update.participants
      for (const user of participants) {
        if (user === conn.user.jid) continue // Ignorar si el bot es añadido
        
        const groupId = update.id
        const config = welcomeData.groups[groupId]?.welcome || welcomeData.default.welcome
        
        if (config.text) {
          const groupMetadata = await conn.groupMetadata(groupId)
          const participants = await conn.groupMetadata(groupId).then(m => m.participants)
          
          // Reemplazar variables
          let message = config.text
            .replace(/@user/g, `@${user.split('@')[0]}`)
            .replace(/%subject/g, groupMetadata.subject)
            .replace(/%members/g, participants.length)
            .replace(/%desc/g, groupMetadata.desc || 'Sin descripción')
            .replace(/%owner/g, groupMetadata.owner || 'Desconocido')
            .replace(/%botname/g, global.namebot)
          
          const mentionedJid = [user]
          
          // Preparar mensaje
          const msgOptions = {
            text: message,
            contextInfo: {
              mentionedJid: mentionedJid
            }
          }
          
          // Añadir imagen si existe
          if (config.image) {
            msgOptions.image = { url: config.image }
            msgOptions.caption = message
          }
          
          await conn.sendMessage(groupId, msgOptions)
        }
      }
    }
    
    // Detectar cuando alguien sale
    if (update.action === 'remove') {
      const participants = update.participants
      for (const user of participants) {
        const groupId = update.id
        const config = welcomeData.groups[groupId]?.bye || welcomeData.default.bye
        
        if (config.text) {
          const groupMetadata = await conn.groupMetadata(groupId)
          const participants = await conn.groupMetadata(groupId).then(m => m.participants)
          
          // Reemplazar variables
          let message = config.text
            .replace(/@user/g, `@${user.split('@')[0]}`)
            .replace(/%subject/g, groupMetadata.subject)
            .replace(/%members/g, participants.length)
            .replace(/%reason/g, 'Se fue del grupo')
            .replace(/%botname/g, global.namebot)
          
          const mentionedJid = [user]
          
          // Preparar mensaje
          const msgOptions = {
            text: message,
            contextInfo: {
              mentionedJid: mentionedJid
            }
          }
          
          // Añadir imagen si existe
          if (config.image) {
            msgOptions.image = { url: config.image }
            msgOptions.caption = message
          }
          
          await conn.sendMessage(groupId, msgOptions)
        }
      }
    }
  } catch (e) {
    console.error('Error en groupUpdate:', e)
  }
}

// Configuración del handler
handler.command = ['setwelcome', 'setbye', 'testwelcome', 'testbye', 'welsettings', 'configwel']
handler.tags = ['group', 'admin']
handler.help = [
  'setwelcome text [mensaje]',
  'setwelcome image [url]',
  'setwelcome view',
  'setwelcome reset',
  'setbye text [mensaje]',
  'setbye image [url]',
  'setbye view',
  'setbye reset',
  'testwelcome',
  'testbye',
  'welsettings'
]
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
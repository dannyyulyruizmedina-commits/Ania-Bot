//--> Hecho por Ado-rgb (github.com/Ado-rgb)
// •|• No quites créditos..
import fetch from 'node-fetch'

let linkRegex = /chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}/i
let linkRegex1 = /whatsapp\.com\/channel\/[0-9A-Za-z]{20,24}/i
const defaultImage = 'https://files.catbox.moe/ubftco.jpg'

async function isAdminOrOwner(m, conn) {
  try {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const participant = groupMetadata.participants.find(p => p.id === m.sender)
    return participant?.admin || m.fromMe
  } catch {
    return false
  }
}

const handler = async (m, { conn, command, args, isAdmin, isOwner }) => {
  if (!m.isGroup) return m.reply('🔒 Solo funciona en grupos.')

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]
  const type = (args[0] || '').toLowerCase()
  const enable = command === 'on'

  // Comando setwelcome
  if (command === 'setwelcome') {
    if (!isAdmin) return m.reply('❌ Solo admins pueden configurar el mensaje de bienvenida.')
    
    const text = args.slice(1).join(' ')
    if (!text) {
      // Mostrar información del grupo y variables disponibles
      const groupMetadata = await conn.groupMetadata(m.chat)
      const info = `
📋 *INFORMACIÓN PARA CONFIGURAR WELCOME*

📍 *Variables disponibles:*
• *{user}* - Menciona al usuario
• *{group}* - Nombre del grupo
• *{members}* - Número de miembros
• *{desc}* - Descripción del grupo
• *{rules}* - Reglas del grupo (si existen)

📍 *Ejemplo de uso:*
\`\`\`
.setwelcome ¡Hola {user}!
Bienvenido a *{group}* 👋
Somos {members} miembros activos.

📜 *Descripción del grupo:*
{desc}

📍 *Reglas importantes:*
{rules}

¡Disfruta tu estadía! 🎉
\`\`\`

📍 *Descripción actual del grupo:*
${groupMetadata.desc || 'ℹ️ No hay descripción configurada'}

📍 *Para configurar un welcome personalizado:*
*.setwelcome <tu mensaje aquí>*
      `.trim()
      
      return m.reply(info)
    }
    
    // Guardar el mensaje personalizado
    if (!chat.welcomeMessages) chat.welcomeMessages = {}
    chat.welcomeMessages.custom = text
    return m.reply('✅ *Mensaje de bienvenida configurado correctamente.*\n\n📝 *Tu mensaje guardado:*\n' + text)
  }

  // Comando delwelcome
  if (command === 'delwelcome') {
    if (!isAdmin) return m.reply('❌ Solo admins pueden eliminar el mensaje de bienvenida.')
    
    if (chat.welcomeMessages && chat.welcomeMessages.custom) {
      delete chat.welcomeMessages.custom
      return m.reply('✅ *Mensaje de bienvenida personalizado eliminado.*\n\n⚠️ Se usará el mensaje por defecto.')
    } else {
      return m.reply('ℹ️ *No hay mensaje de bienvenida personalizado configurado.*')
    }
  }

  // Comandos on/off existentes
  if (!['antilink', 'welcome', 'antiarabe', 'modoadmin'].includes(type)) {
    return m.reply(`✳️ *Comandos disponibles:*\n\n` +
      `*🔧 Activar/Desactivar:*\n` +
      `• *.on/off antilink* - Bloquear enlaces\n` +
      `• *.on/off welcome* - Bienvenidas automáticas\n` +
      `• *.on/off antiarabe* - Bloquear números árabes\n` +
      `• *.on/off modoadmin* - Solo admins pueden hablar\n\n` +
      `*🎨 Personalizar Welcome:*\n` +
      `• *.setwelcome* - Ver ayuda y configurar\n` +
      `• *.delwelcome* - Eliminar welcome personalizado`)
  }

  if (!isAdmin) return m.reply('❌ Solo admins (no owner) pueden activar o desactivar funciones.')

  if (type === 'antilink') {
    chat.antilink = enable
    if(!chat.antilinkWarns) chat.antilinkWarns = {}
    if(!enable) chat.antilinkWarns = {}
    return m.reply(`✅ Antilink ${enable ? 'activado' : 'desactivado'}.`)
  }

  if (type === 'welcome') {
    chat.welcome = enable
    return m.reply(`✅ Welcome ${enable ? 'activado' : 'desactivado'}.`)
  }

  if (type === 'antiarabe') {
    chat.antiarabe = enable
    return m.reply(`✅ Antiarabe ${enable ? 'activado' : 'desactivado'}.`)
  }

  if (type === 'modoadmin') {
    chat.modoadmin = enable
    return m.reply(`✅ Modo Admin ${enable ? 'activado' : 'desactivado'}.`)
  }
}

handler.command = ['on', 'off', 'setwelcome', 'delwelcome']
handler.group = true
handler.register = false
handler.tags = ['group']
handler.help = [
  'on welcome', 'off welcome',
  'on antilink', 'off antilink',
  'on modoadmin', 'off modoadmin',
  'on antiarabe', 'off antiarabe',
  'setwelcome <texto>',
  'delwelcome'
]

handler.before = async (m, { conn }) => {
  if (!m.isGroup) return
  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]

  // Modo Admin
  if (chat.modoadmin) {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const isUserAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    if (!isUserAdmin && !m.fromMe) return
  }

  // Anti Arabe
  if (chat.antiarabe && m.messageStubType === 27) {
    const newJid = m.messageStubParameters?.[0]
    if (!newJid) return

    const number = newJid.split('@')[0].replace(/\D/g, '')
    const arabicPrefixes = ['212', '20', '971', '965', '966', '974', '973', '962']
    const isArab = arabicPrefixes.some(prefix => number.startsWith(prefix))

    if (isArab) {
      await conn.sendMessage(m.chat, { 
        text: `Este pndj ${newJid} será expulsado, no queremos العرب aca, adiosito. [ Anti Arabe Activado ]` 
      })
      await conn.groupParticipantsUpdate(m.chat, [newJid], 'remove')
      return true
    }
  }

  // Anti Link
  if (chat.antilink) {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const isUserAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin
    const text = m?.text || ''

    if (!isUserAdmin && (linkRegex.test(text) || linkRegex1.test(text))) {
      const userTag = `@${m.sender.split('@')[0]}`
      const delet = m.key.participant
      const msgID = m.key.id

      try {
        const ownGroupLink = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`
        if (text.includes(ownGroupLink)) return
      } catch { }

      if (!chat.antilinkWarns) chat.antilinkWarns = {}
      if (!chat.antilinkWarns[m.sender]) chat.antilinkWarns[m.sender] = 0

      chat.antilinkWarns[m.sender]++

      if (chat.antilinkWarns[m.sender] < 3) {
        try {
          await conn.sendMessage(m.chat, {
            text: `🚫 Hey ${userTag}, no se permiten links aquí. Esta es tu advertencia ${chat.antilinkWarns[m.sender]}/3.`,
            mentions: [m.sender]
          }, { quoted: m })

          await conn.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: false,
              id: msgID,
              participant: delet
            }
          })
        } catch {
          await conn.sendMessage(m.chat, {
            text: `⚠️ No pude eliminar el mensaje de ${userTag}.`,
            mentions: [m.sender]
          }, { quoted: m })
        }
      } else {
        try {
          await conn.sendMessage(m.chat, {
            text: `🚫 ${userTag} alcanzó 3 advertencias por enviar links. Ahora serás expulsado.`,
            mentions: [m.sender]
          }, { quoted: m })

          await conn.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: false,
              id: msgID,
              participant: delet
            }
          })

          await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
          chat.antilinkWarns[m.sender] = 0
        } catch {
          await conn.sendMessage(m.chat, {
            text: `⚠️ No pude expulsar a ${userTag}. Puede que no tenga permisos.`,
            mentions: [m.sender]
          }, { quoted: m })
        }
      }

      return true
    }
  }

  // Welcome y Goodbye
  if (chat.welcome && [27, 28, 32].includes(m.messageStubType)) {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const groupSize = groupMetadata.participants.length
    const userId = m.messageStubParameters?.[0] || m.sender
    const userMention = `@${userId.split('@')[0]}`
    let profilePic

    try {
      profilePic = await conn.profilePictureUrl(userId, 'image')
    } catch {
      profilePic = defaultImage
    }

    // Nuevo miembro
    if (m.messageStubType === 27) {
      let welcomeMessage
      
      // Verificar si hay mensaje personalizado
      if (chat.welcomeMessages && chat.welcomeMessages.custom) {
        welcomeMessage = chat.welcomeMessages.custom
          .replace(/{user}/g, userMention)
          .replace(/{group}/g, groupMetadata.subject)
          .replace(/{members}/g, groupSize)
          .replace(/{desc}/g, groupMetadata.desc || 'ℹ️ No hay descripción configurada')
          .replace(/{rules}/g, chat.rules || '📌 No hay reglas específicas configuradas')
      } else {
        // Mensaje por defecto
        welcomeMessage = `
🌟 *BIENVENIDO/A* 🌟

👋 Hola ${userMention}!

🙌 Te damos la bienvenida a *${groupMetadata.subject}*  
👥 Somos *${groupSize}* personas en esta comunidad.

📜 *Descripción del grupo:*
${groupMetadata.desc || 'ℹ️ No hay descripción configurada'}

📌 Porfa sigue las reglas para que todos la pasemos chido.
🛠️ Si necesitas ayuda, habla con algún admin.
✨ ¡Disfruta y participa activamente!

*──────────*
`.trim()
      }

      await conn.sendMessage(m.chat, {
        image: { url: profilePic },
        caption: welcomeMessage,
        contextInfo: { mentionedJid: [userId] }
      })
    }

    // Miembro sale o es expulsado
    if (m.messageStubType === 28 || m.messageStubType === 32) {
      const txtBye = '👋 HASTA PRONTO 👋'
      const despedida = `
⚠️ El usuario ${userMention} ha salido de *${groupMetadata.subject}*  
👥 Quedamos *${groupSize}* miembros.

🙏 Gracias por tu tiempo y esperamos verte de nuevo pronto.
💬 Recuerda que las puertas siempre están abiertas.

*──────────*
`.trim()

      await conn.sendMessage(m.chat, {
        image: { url: profilePic },
        caption: `${txtBye}\n\n${despedida}`,
        contextInfo: { mentionedJid: [userId] }
      })
    }
  }
}

export default handler
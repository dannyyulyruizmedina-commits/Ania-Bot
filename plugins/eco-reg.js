import db from '../lib/database.js'
import fs from 'fs'
import PhoneNumber from 'awesome-phonenumber'
import { createHash } from 'crypto'
import fetch from 'node-fetch'
import moment from 'moment-timezone'

const Reg = /(.*)[.|] ?([0-9]+)$/i

let handler = async function (m, { conn, text, usedPrefix, command }) {
  const who = m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender)
  const pp = await conn.profilePictureUrl(who, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg')
  const user = global.db.data.users[m.sender]
  const name2 = await conn.getName(m.sender)
  const fecha = moment().tz('America/Tegucigalpa').toDate()
  const moneda = global.moneda || '💰'
  const reinoEspiritual = global.canalreg || null

  if (user.coin === undefined) user.coin = 0
  if (user.exp === undefined) user.exp = 0
  if (user.joincount === undefined) user.joincount = 0

  if (user.registered) {
    return m.reply(`🔒 Ya estás registrado

¿Deseas reiniciar tu energía vital?
➤ Usa: ${usedPrefix}unreg para renacer en el sistema`)
  }

  if (!Reg.test(text)) {
    return m.reply(`❗ Formato erróneo dimensional

➤ Usa: ${usedPrefix + command} nombre.edad
➤ Ejemplo: ${usedPrefix + command} ${name2}.18`)
  }

  let [_, name, age] = text.match(Reg)

  if (!name) return m.reply('⚠️ Tu identidad no puede estar vacía')
  if (!age) return m.reply('⚠️ Edad requerida para iniciar el viaje')
  if (name.length >= 100) return m.reply('⚠️ Nombre demasiado extenso para esta realidad')

  age = parseInt(age)
  if (age > 1000) return m.reply('⚠️ Edad cósmica no permitida')
  if (age < 13) return m.reply('⚠️ Debes tener al menos 13 lunas de existencia')

  user.name = name.trim()
  user.age = age
  user.regTime = +new Date()
  user.registered = true
  user.coin += 46
  user.exp += 310
  user.joincount += 25

  const sn = createHash('md5').update(m.sender).digest('hex').slice(0, 20)

  const certificadoPacto = `
🪪 ✦⟩ 𝖢𝖾𝗋𝗍𝗂𝖿𝗂𝖼𝖺𝖽𝗈  ✦⟨🪪

🔮 Nombre: ${name}
🕒 Edad: ${age}
🧬 Código ID: ${sn}
📅 Registro: ${fecha.toLocaleDateString()}`.trim()

  await m.react('✅')

  await conn.sendMessage(m.chat, {
    image: { url: pp },
    caption: certificadoPacto
  }, { quoted: m })

  if (reinoEspiritual) {
    const mensajeNotificacion = `
☄︎✦❀ 〘 Nuevo Registro Detectado 〙❀✦☄︎

🧝‍♂️ Nombre: ${name}
🧸 Edad: ${age}
🧿 ID: ${sn}
⏳ Fecha: ${moment().format('YYYY-MM-DD HH:mm:ss')}

✨ Recompensas iniciales ✨
${moneda}: +46`.trim()

    try {
      if (global.conn?.sendMessage) {
        await global.conn.sendMessage(reinoEspiritual, {
          image: { url: pp },
          caption: mensajeNotificacion
        })
      }
    } catch (e) {
      console.error('❌ Error en la transmisión espiritual:', e)
    }
  }
}


handler.command = ['reg']

export default handler
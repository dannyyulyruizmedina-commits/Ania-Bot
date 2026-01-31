let handler = async (m, { conn }) => {
  const name = 'Yuly'
  const number = '573105375475' // sin @
  const email = 'developer.wilker.ofc@gmail.com'
  const org = 'Creadora de Ania bot'
  const note = 'Mini desarrolladora de bots de WhatsApp'

  const vcard = `
BEGIN:VCARD
VERSION:3.0
N:${name}
FN:${name}
ORG:${org}
EMAIL;type=EMAIL:${email}
TEL;type=CELL;type=VOICE;waid=${number}:${number}
NOTE:${note}
END:VCARD
`.trim()

  await conn.sendMessage(m.chat, {
    contacts: {
      displayName: name,
      contacts: [{ vcard }],
    },
  }, { quoted: m })
}

handler.help = ['creador']
handler.tags = ['info']
handler.command = ['creador', 'owner', 'creator']

export default handler

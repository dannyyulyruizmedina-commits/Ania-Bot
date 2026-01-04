import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        await m.react('🏠')
        
        // Mensaje principal
        const hostingMessage = `
╭━━━━━━━━━━━━━━━━━━╮
   🔷 *HOSTING CONFIABLE* 🔷
╰━━━━━━━━━━━━━━━━━━╯

*¿Buscas un hosting que realmente funcione?*

╭━━━━━━━━━━━━━━━━━━╮
      🚀 *SwalloX Host* 🚀
╰━━━━━━━━━━━━━━━━━━╯

*¡El hogar perfecto para tus proyectos!* 💫

Si necesitas que tus proyectos estén siempre en línea sin preocuparte por caídas constantes, Swallox Host es la opción ideal. 

Ya sea para tus bots WhatsApp, Discord, Telegram como páginas Web o cualquier otro script, aquí tienes el control total de forma intuitiva.

*✨ Beneficios destacados:*
• ✅ 99.9% Uptime garantizado
• ⚡ Velocidad de carga ultrarrápida
• 🔒 Seguridad avanzada
• 📱 Panel de control intuitivo
• 🛟 Soporte técnico 24/7
• 💾 Almacenamiento SSD de alta velocidad

*🌐 Enlaces de acceso:*
⭐ *Dashboard:* https://dash.swallox.com
⭐ *Panel:* https://panel.swallox.com

╭━━━━━━━━━━━━━━━━━━╮
       📱 *COMUNIDAD* 📱
╰━━━━━━━━━━━━━━━━━━╯

_También puedes unirte a nuestra comunidad para recibir novedades y ayuda directa:_

🏷️ *Canal:* https://whatsapp.com/channel/0029Vb6I6zTEQIanas9U0N2I
🏷️ *Grupo:* https://chat.whatsapp.com/Bzo7jcdivDGJc3thZrSyEC

╭━━━━━━━━━━━━━━━━━━╮
    💝 *PALABRAS ESENSIALES* 💝
╰━━━━━━━━━━━━━━━━━━╯

*"Con Swallox Host, tus sueños digitales encuentran un hogar seguro y acogedor. No solo alojamos proyectos, cultivamos éxitos."* 🌟

*"Tu tranquilidad es nuestra prioridad. Dormirás mejor sabiendo que tus proyectos están en las mejores manos."* 😴✨

*"Como una cálida casa para tus ideas, Swallox Host ofrece estabilidad, confianza y crecimiento continuo."* 🏡💻

*"Más que un servicio, somos tu socio tecnológico. Juntos haremos que tus proyectos brillen con luz propia."* 🤝💡

*"La tecnología con corazón: rápida cuando necesitas potencia, suave cuando requieres facilidad."* ❤️⚙️

╭━━━━━━━━━━━━━━━━━━╮
   🎯 *¿LISTO PARA EMPEZAR?* 🎯
╰━━━━━━━━━━━━━━━━━━╯

*¡Tu proyecto merece lo mejor! Comienza tu viaje con Swallox Host hoy mismo y descubre la diferencia de un hosting que realmente se preocupa por ti.* 🚀🌈

*"Porque tus éxitos son nuestros éxitos"* 🎉
        `

        // Enviar el mensaje
        await conn.sendMessage(m.chat, {
            text: hostingMessage,
            contextInfo: {
                externalAdReply: {
                    title: "🚀 SwalloX Host - Hosting Premium",
                    body: "Tu hosting confiable 24/7",
                    thumbnailUrl: "https://i.imgur.com/vPn2Ql2.png", // Puedes cambiar esta imagen
                    sourceUrl: "https://panel.swallox.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('❌')
        console.error(error)
        await conn.reply(m.chat, `⚠️ Ocurrió un error al mostrar la información del hosting.\nUsa *${usedPrefix}report* para informar el problema.`, m)
    }
}

handler.help = ['hosting']
handler.tags = ['info', 'tools']
handler.command = ['hosting', 'host', 'swallox', 'alojamiento']

export default handler
import yts from "yt-search"

// 🐉 Configuración cooldown
const cooldowns = new Map()
const COOLDOWN_TIME = 15 * 1000 // 15 segundos

let handler = async (m, { conn, args }) => {
    const userId = m.sender
    
    // 🐉 Verificar cooldown
    if (cooldowns.has(userId)) {
        const expire = cooldowns.get(userId)
        const remaining = expire - Date.now()
        if (remaining > 0) {
            return m.reply(`🐉 *Espera ${Math.ceil(remaining / 1000)} segundos* antes de usar otra vez.`)
        }
    }
    
    // 🐉 Activar cooldown
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME)
    
    try {
        if (!args.length) {
            cooldowns.delete(userId)
            return m.reply('🐉 *Ingresa el nombre de la canción*')
        }
        
        const query = args.join(" ")
        const search = await yts(query)
        
        if (!search.videos || !search.videos.length) {
            cooldowns.delete(userId)
            return m.reply('🐉 *No encontré resultados*')
        }
        
        const video = search.videos[0]
        
        // 🐉 Thumbnail seguro
        const safeThumbnail = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
        
        // 🐉 Caption estilo Gohan Beast
        const caption = `🐉 *¡VIDEO ENCONTRADO!* ⚡\n
📛 *Título:* ${video.title}
👤 *Canal:* ${video.author.name}
⏱️ *Duración:* ${video.timestamp}
👁️ *Vistas:* ${video.views.toLocaleString()}
🔗 *URL:* ${video.url}\n
🎯 *Elige formato:*`
        
        // 🐉 Botones
        const buttons = [
            {
                buttonId: `.ytaudio ${video.url}`,
                buttonText: { displayText: "🎵 Audio" },
                type: 1
            },
            {
                buttonId: `.ytvideo ${video.url}`,
                buttonText: { displayText: "🎬 Video" },
                type: 1
            },
            {
                buttonId: `.ytdoc ${video.url}`,
                buttonText: { displayText: "📄 Documento" },
                type: 1
            }
        ]
        
        // 🐉 Enviar mensaje
        try {
            await conn.sendMessage(
                m.chat,
                {
                    image: { url: safeThumbnail },
                    caption: caption,
                    buttons: buttons,
                    footer: "🐉 SonGokuBot • Modo Gohan Beast ⚡",
                    headerType: 4
                },
                { quoted: m }
            )
        } catch (err) {
            console.log("Thumbnail falló, enviando sin imagen")
            await conn.sendMessage(
                m.chat,
                {
                    text: caption,
                    buttons: buttons,
                    footer: "🐉 SonGokuBot • Modo Gohan Beast ⚡",
                    headerType: 1
                },
                { quoted: m }
            )
        }
        
        // 🐉 Reacciones
        await m.react('✅')
        
    } catch (e) {
        console.error("PLAY ERROR:", e)
        cooldowns.delete(userId)
        await m.react('❌')
        m.reply('🐉 *Error en la búsqueda*')
    }
}

// 🐉 Comandos
handler.help = ['play <nombre canción>']
handler.tags = ['dl', 'audio']
handler.command = ['play', 'p', 'musica']

export default handler
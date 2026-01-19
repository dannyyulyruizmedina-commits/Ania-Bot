import fetch from 'node-fetch';
import fs from 'fs';
import { promisify } from 'util';

const downloadFile = async (url, outputPath) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al descargar: ${response.statusText}`);
  }
  
  const fileStream = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
  
  return outputPath;
};

// Handler para Minecraft
let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    // Mensaje inicial
    await m.react('⏳');
    await m.reply('*📥 Descargando Minecraft... Esto puede tomar unos momentos...*');

    // URL del archivo de Minecraft (MediaFire)
    const minecraftUrl = 'https://www.mediafire.com/file/ob7cofik24nxf7n/MCPE_1.21.131_OFICIAL_%25C3%259ALTIMA_VERSI%25C3%2593N_CON_M%25C3%259ASICA_Army_Of_Grissby.apk_mod.apk/file';
    
    // Nombre del archivo
    const fileName = 'Minecraft_PE_1.21.131_Mod.apk';
    const tempFilePath = `./${fileName}`;
    
    // Primero necesitamos obtener el link directo de MediaFire
    // MediaFire requiere extraer el link real de descarga
    const mediaFireResponse = await fetch(minecraftUrl);
    const html = await mediaFireResponse.text();
    
    // Buscar el link directo en el HTML (esto puede variar según MediaFire)
    // Patrón común para encontrar el link de descarga
    const directLinkMatch = html.match(/https?:\/\/download\d+\.mediafire\.com\/[^"']+/);
    
    if (!directLinkMatch) {
      // Si no encontramos el link directo, intentamos otro método
      // Usamos un servicio para obtener el link directo
      const directServiceUrl = `https://direct-link.net/api?api=TU_API_KEY&url=${encodeURIComponent(minecraftUrl)}`;
      
      try {
        const directResponse = await fetch(directServiceUrl);
        const directData = await directResponse.json();
        
        if (directData.downloadUrl) {
          // Descargar el archivo
          await downloadFile(directData.downloadUrl, tempFilePath);
        } else {
          throw new Error('No se pudo obtener el enlace de descarga');
        }
      } catch (serviceError) {
        // Método alternativo: usar un servicio público
        const publicServiceUrl = `https://api.vevioz.com/api/button/mp4?url=${encodeURIComponent(minecraftUrl)}`;
        const publicResponse = await fetch(publicServiceUrl);
        const publicData = await publicResponse.json();
        
        if (publicData.url || publicData.downloadUrl) {
          const downloadUrl = publicData.url || publicData.downloadUrl;
          await downloadFile(downloadUrl, tempFilePath);
        } else {
          throw new Error('No se pudo obtener el enlace directo');
        }
      }
    } else {
      // Usar el link directo encontrado
      await downloadFile(directLinkMatch[0], tempFilePath);
    }
    
    // Leer el archivo como buffer
    const fileBuffer = fs.readFileSync(tempFilePath);
    
    // Obtener información del archivo
    const fileSize = fileBuffer.length;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    // Enviar mensaje informativo
    await m.reply(`*✅ Descarga completada*\n*📁 Archivo:* ${fileName}\n*📊 Tamaño:* ${fileSizeMB} MB\n\n*📤 Enviando...*`);
    
    // Enviar el archivo APK
    await conn.sendMessage(m.chat, {
      document: fileBuffer,
      mimetype: 'application/vnd.android.package-archive',
      fileName: fileName
    }, { quoted: m });
    
    // Limpiar archivo temporal
    try {
      fs.unlinkSync(tempFilePath);
    } catch (cleanError) {
      console.error('Error al limpiar archivo temporal:', cleanError);
    }
    
    // Reacción de éxito
    await m.react('✅');
    
  } catch (error) {
    console.error('Error en comando mcft:', error);
    
    // Mensajes de error específicos
    let errorMessage = `*❌ Error al descargar Minecraft*\n`;
    
    if (error.message.includes('ENOSPC') || error.message.includes('espacio')) {
      errorMessage += '_No hay suficiente espacio en disco_';
    } else if (error.message.includes('tiempo') || error.message.includes('timeout')) {
      errorMessage += '_La descarga tomó demasiado tiempo_';
    } else if (error.message.includes('descarga') || error.message.includes('download')) {
      errorMessage += '_No se pudo obtener el enlace de descarga_';
    } else {
      errorMessage += `_${error.message}_`;
    }
    
    errorMessage += '\n\n🔗 *Enlace manual:* https://www.mediafire.com/file/ob7cofik24nxf7n/MCPE_1.21.131_OFICIAL_%25C3%259ALTIMA_VERSI%25C3%2593N_CON_M%25C3%259ASICA_Army_Of_Grissby.apk_mod.apk/file';
    
    await m.reply(errorMessage);
    await m.react('❌');
  }
};

// Información del comando
handler.help = ['mcft'];
handler.tags = ['juegos', 'descargas'];
handler.command = ['mcft', 'minecraft', 'mcpe'];
handler.desc = 'Descarga Minecraft PE 1.21.131 Mod';
handler.register = false;
handler.premium = false;
handler.limit = false; // Limitar uso

export default handler;
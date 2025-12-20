import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const handler = async (msg, { conn, text}) => {
  const chatID = msg.key.remoteJid;
  await conn.sendPresenceUpdate("composing", chatID);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await conn.sendPresenceUpdate("paused", chatID);

  const rawID = conn.user?.id || "";
  const subbotID = rawID.split(":")[0] + "@s.whatsapp.net";

  const prefixPath = path.resolve("prefixes.json");
  let prefixes = {};
  if (fs.existsSync(prefixPath)) {
    prefixes = JSON.parse(fs.readFileSync(prefixPath, "utf-8"));
}
  const usedPrefix = prefixes[subbotID] || ".";

  if (!text) {
    return conn.sendMessage(chatID, {
      text:
        `✳️ *Uso correcto:* \n\n${usedPrefix}bancheck <número>\n\n` +
        `> 🔹 *Ejemplo:* ${usedPrefix}bancheck 584125877491`,
}, { quoted: msg});
}

  const cleanNumber = text.replace(/[^0-9]/g, "");
  if (cleanNumber.length < 8) {
    return conn.sendMessage(chatID, {
      text: "❌ Número inválido. Debe tener al menos 8 dígitos.",
}, { quoted: msg});
}

  await conn.sendMessage(chatID, {
    react: { text: "⏳", key: msg.key},
});

  try {
    const url = `https://io.tylarz.top/v1/bancheck?number=${cleanNumber}&lang=es`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Api-Key": "nami",
},
      timeout: 15000,
});

    const data = await res.json();
    if (!data.status) throw new Error("La API no respondió correctamente");

    const banInfo = data.data;
    const check = "✓";
    const cross = "×";

    let result = `🔹 *Banned Number Check* 🔹\n\n`;
    result += `> _Verificando información del número *${cleanNumber}*:_\n\n`;
    result += `  ◦  *Baneado:* ${banInfo.isBanned? check: cross}\n`;

    if (banInfo.isBanned) {
      result += `  ◦  *Permanente:* ${banInfo.isPermanent? check: cross}\n`;
      result += `  ◦  *Razón:*\n> ${banInfo.violation_description || "No especificada"}\n`;
      result += `  ◦  *ModBan:* ${cross}\n`;
      result += `  ◦  *Registrado:* ${check}\n`;

      if (banInfo.violation_info) {
        result += `\n  ◦  *Duración:*\n> ${banInfo.violation_info.duration || "No especificada"}\n`;
        result += `  ◦  *Riesgo:*\n> ${banInfo.violation_info.risk || "No especificado"}\n`;
}

      if (banInfo.in_app_ban_appeal === 1) {
        result += `  ◦  *Apelación:* ${check}\n`;
}
} else {
      result += `  ◦  *Permanente:* ${cross}\n`;
      result += `  ◦  *Razón:* ${cross}\n`;
      result += `  ◦  *ModBan:* ${cross}\n`;
      result += `  ◦  *Registrado:* ${check}\n`;
      result += `\n  ◦  *Estado:* ✅ Activo y sin sanciones`;
}

    result += `\n\n> Powered by: *WILKER OFC*`;

    await conn.sendMessage(chatID, { text: result}, { quoted: msg});
    await conn.sendMessage(chatID, {
      react: { text: "✅", key: msg.key},
});
} catch (error) {
    console.error("Error en bancheck:", error);

    let errMsg = "*🔹──  Banned Number Check  ──🔹*\n\n";
    errMsg += "❌ *Error verificando el número.*\n\n";

    if (error.code === "ECONNABORTED") {
      errMsg += "⏰ _Timeout - Servidor no respondió_";
} else if (error.status === 403) {
      errMsg += "🔒 _Acceso denegado por Cloudflare_";
} else if (error.status === 404) {
      errMsg += "🔍 _Número no encontrado_";
} else {
      errMsg += "⚠️ _Error interno del servicio_";
}

    errMsg += "\n\n> Powered by: *Michi wabot*";

    await conn.sendMessage(chatID, { text: errMsg}, { quoted: msg});
    await conn.sendMessage(chatID, {
      react: { text: "❌", key: msg.key},
});
}
};

handler.command = ["bancheck", "banverify", "checkban", "check"];
export default handler;
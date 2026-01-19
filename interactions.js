export async function onRequestPost(context) {
  const { request, env } = context;
  // ... (kode verifikasi signature tetap sama seperti sebelumnya) ...

  const interaction = JSON.parse(body);

  // Perintah /setup
  if (interaction.data.name === 'setup') {
    const guildId = interaction.guild_id;
    const serverUrl = interaction.data.options.find(opt => opt.name === 'url').value;

    // Simpan ke Cloudflare KV
    // Key: guild_id, Value: URL Server mereka
    await env.SERVER_CONFIG.put(guildId, serverUrl);

    return new Response(JSON.stringify({
      type: 4,
      data: { content: `Configuration Sucsessful! Your server is registered at: ${serverUrl}` }
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Perintah /bangun
  if (interaction.data.name === 'bangun') {
    const guildId = interaction.guild_id;
    
    // Ambil data dari KV berdasarkan ID server yang memanggil
    const targetUrl = await env.SERVER_CONFIG.get(guildId);

    if (!targetUrl) {
      return new Response(JSON.stringify({
        type: 4,
        data: { content: "Server is not yet setup! Use /setup first." }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Panggil server pengguna tersebut
    await fetch(targetUrl + "/wake-on-lan");

    return new Response(JSON.stringify({
      type: 4,
      data: { content: "Wake on LAN Signal has been sent to your server!" }
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}

import { Buffer } from 'buffer';
import crypto from 'crypto';

async function verifySignature(request, body) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!signature || !timestamp || !publicKey) return false;
  return crypto.verify(null, Buffer.from(timestamp + body), crypto.createPublicKey({
    key: Buffer.from(publicKey, 'hex'), format: 'der', type: 'spki',
  }), Buffer.from(signature, 'hex'));
}

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const body = await request.text();
  const isValid = await verifySignature(request, body);
  if (!isValid) return new Response('Invalid request signature', { status: 401 });

  const interaction = JSON.parse(body);

  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (interaction.type === 2) {
    const { name } = interaction.data;

    if (name === 'setup') {
      return new Response(JSON.stringify({
        type: 4,
        data: {
          content: `### ⚠️ Terms of Service & Security\nThis application is for **authorized management only**. This license applies to **VPS**, **VDS**, and **Physical Servers**.\n\n**Key Rules:**\n* Managing servers you legally **rent** or **purchased** is permitted.\n* Unauthorized access to servers you do not own is a **strictly prohibited cybercrime**.\n* **Closed Source:** This application is proprietary.\n\n**Privacy Policy (Optional):**\n* We collect basic hardware metrics. No personal files are accessed.`,
          flags: 64,
          components: [{
            type: 1,
            components: [
              { type: 2, label: "Accept ToS", style: 3, custom_id: "tos_accept" },
              { type: 2, label: "Decline (Self-Destruct)", style: 4, custom_id: "tos_deny" },
              { type: 2, label: "Privacy Info", style: 2, custom_id: "privacy_info" }
            ]
          }]
        }
      }), { headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (interaction.type === 3) {
    const { custom_id } = interaction.data;
    const guildId = interaction.guild_id;

    if (custom_id === "tos_accept") {
      return new Response(JSON.stringify({
        type: 4,
        data: {
          content: "✅ **Terms Accepted.**\n\nRun this on your terminal to connect:\n`curl -sL https://raw.githubusercontent.com/riansio/ServManage/main/discord.sh | bash`",
          flags: 64
        }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (custom_id === "privacy_info") {
      return new Response(JSON.stringify({
        type: 4,
        data: { content: "ℹ️ **Privacy Info:** Hardware monitoring only. Declining this specific part does not trigger a server exit.", flags: 64 }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (custom_id === "tos_deny") {
      const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
      
      // Triggering the bot to leave the server
      fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bot ${DISCORD_TOKEN}` }
      });

      return new Response(JSON.stringify({
        type: 4,
        data: { 
          content: `🧨 **SELF-DESTRUCT INITIATED.**\n\nYou have declined the Terms of Service. \n\n**FINAL WARNING:** Accessing or managing infrastructure that you do not legally own or have explicit permission for is a **CYBERCRIME** punishable by law. This application will now remove itself to prevent unauthorized use.\n\n**Farewell. Goodbye!**`, 
          flags: 64 
        }
      }), { headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ type: 4, data: { content: "Acknowledged." } }), { headers: { 'Content-Type': 'application/json' } });
}

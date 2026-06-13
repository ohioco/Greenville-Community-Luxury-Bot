// embeds/alliances.js
// FIX 1: message.member null-check added
// FIX 2: delete trigger before sending embeds (no visible flash)
// FIX 3: permission denial deletes trigger quietly instead of public reply
// NOTE:  requires GatewayIntentBits.MessageContent — see rules.js for details

const { EmbedBuilder } = require("discord.js");

// ⚠️  This uses a DIFFERENT role ID from rules.js (1510346654241394848).
//     If that's intentional (different staff tiers), leave it.
//     If it should be the same role as rules.js, change to: "1508564268415713533"
const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (message.author.bot) return;
    if (message.content.toLowerCase() !== "?alliances") return;

    // FIX: message.member can be null for partial guild members
    if (!message.member) return;

    if (!message.member.roles.cache.has(STAFF_ROLE)) {
      await message.delete().catch(() => {});
      return;
    }

    // Delete trigger before sending so there's no visible flash
    await message.delete().catch(() => {});

    const embed1 = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Server Alliances")
      .setColor(BABY_BLUE)
      .setImage("https://i.ibb.co/R4cgvv83/Untitled156-20260613225207.png");

    const embed2 = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Server Alliances")
      .setColor(BABY_BLUE)
      .setDescription(
`Welcome to **Greenville Community Luxury's** Server Alliances. Within our server, we strive to support all roleplay communities in their growth and success.

However, before partnering with our server, you must meet our partnership requirements. All relevant partnership information is listed below.

➜ Active Community Members.
➜ Greenville or Roblox Roleplay Related.
➜ Good Server & Management Reputation.
➜ Organized Server & Departments.`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Server Alliances" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed1, embed2] });
  },
};

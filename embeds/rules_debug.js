const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

const STAFF_ROLE = "1508564268415713533";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  name: "messageCreate",

  async execute(message) {
    console.log("[rules] messageCreate fired | author:", message.author?.tag, "| content:", JSON.stringify(message.content), "| partial:", message.partial);

    if (message.partial) {
      try { await message.fetch(); } catch { return; }
    }

    if (message.author.bot) return;

    console.log("[rules] content check:", JSON.stringify(message.content.toLowerCase()), "=== ?rules:", message.content.toLowerCase() === "?rules");

    if (message.content.toLowerCase() !== "?rules") return;

    console.log("[rules] passed content check | member:", message.member ? "exists" : "NULL");

    if (!message.member) return;

    console.log("[rules] has role?", message.member.roles.cache.has(STAFF_ROLE));

    if (!message.member.roles.cache.has(STAFF_ROLE)) {
      await message.delete().catch(() => {});
      return;
    }

    message.delete().catch(() => {});

    console.log("[rules] attempting channel.send...");

    try {
      const embed = new EmbedBuilder()
        .setTitle("Greenville Community Luxury™ | Server Regulations")
        .setColor(BABY_BLUE)
        .setDescription("Test embed — rules content goes here.")
        .setFooter({ text: "Greenville Community Luxury™ | Server Regulations" })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      console.log("[rules] channel.send succeeded");
    } catch (err) {
      console.error("[rules] channel.send FAILED:", err);
    }
  },
};

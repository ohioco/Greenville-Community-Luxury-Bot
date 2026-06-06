const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

const WORK_AMOUNT   = 500;
const COOLDOWN_MS   = 24 * 60 * 60 * 1000; // 24 hours

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Work to earn $500 (once every 24 hours)"),

  async execute(interaction) {
    const data = db.load();
    if (!data.economy) data.economy = {};

    const id = interaction.user.id;
    if (!data.economy[id]) {
      data.economy[id] = { bank: 0, cash: 0, lastWork: null };
    }

    const eco  = data.economy[id];
    const now  = Date.now();
    const last = eco.lastWork ? new Date(eco.lastWork).getTime() : 0;
    const diff = now - last;

    if (diff < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - diff;
      const hours     = Math.floor(remaining / 3600000);
      const minutes   = Math.floor((remaining % 3600000) / 60000);

      return interaction.reply({
        content: `⏳ You already worked today! Come back in **${hours}h ${minutes}m**.`,
        ephemeral: true
      });
    }

    // Pay goes to on-hand cash
    eco.cash    += WORK_AMOUNT;
    eco.lastWork = new Date().toISOString();
    db.save(data);

    const embed = new EmbedBuilder()
      .setTitle("💼 Work Complete!")
      .setColor(0x57F287)
      .setDescription(`You worked hard and earned **$${WORK_AMOUNT.toLocaleString()}**!`)
      .addFields(
        { name: "💵 On Hand",  value: `$${eco.cash.toLocaleString()}`, inline: true },
        { name: "🏦 Bank",     value: `$${eco.bank.toLocaleString()}`, inline: true },
        { name: "⏰ Next Work", value: `<t:${Math.floor((now + COOLDOWN_MS)/1000)}:R>`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  }
};

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("View your bank balance and on-hand cash"),

  async execute(interaction) {
    const data = db.load();
    if (!data.economy) data.economy = {};

    const id = interaction.user.id;
    if (!data.economy[id]) {
      data.economy[id] = { bank: 0, cash: 0, lastWork: null };
      db.save(data);
    }

    const eco = data.economy[id];
    const total = eco.bank + eco.cash;

    const embed = new EmbedBuilder()
      .setTitle(`💰 Balance — ${interaction.user.username}`)
      .setColor(0x57F287)
      .addFields(
        { name: "🏦 Bank",     value: `$${eco.bank.toLocaleString()}`, inline: true },
        { name: "💵 On Hand",  value: `$${eco.cash.toLocaleString()}`, inline: true },
        { name: "📊 Total",    value: `$${total.toLocaleString()}`,    inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

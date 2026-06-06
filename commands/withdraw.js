const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw money from your bank to your on-hand cash")
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Amount to withdraw")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const data   = db.load();
    if (!data.economy) data.economy = {};

    const id = interaction.user.id;
    if (!data.economy[id]) data.economy[id] = { bank: 0, cash: 0, lastWork: null };

    const eco = data.economy[id];

    if (eco.bank < amount) {
      return interaction.reply({
        content: `❌ Insufficient bank funds. Your bank holds **$${eco.bank.toLocaleString()}**.`,
        ephemeral: true
      });
    }

    eco.bank -= amount;
    eco.cash += amount;
    db.save(data);

    const embed = new EmbedBuilder()
      .setTitle("💵 Withdrawal Successful")
      .setColor(0x57F287)
      .addFields(
        { name: "Withdrawn",  value: `$${amount.toLocaleString()}`,    inline: true },
        { name: "🏦 Bank",    value: `$${eco.bank.toLocaleString()}`,  inline: true },
        { name: "💵 On Hand", value: `$${eco.cash.toLocaleString()}`,  inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

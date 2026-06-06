const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit money into another player's bank account")
    .addUserOption(o =>
      o.setName("user").setDescription("Player to deposit to").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Amount to deposit (from YOUR bank)")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ You cannot deposit money to yourself. Use `/balance` to check your balance.",
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({ content: "❌ You cannot deposit to a bot.", ephemeral: true });
    }

    const data = db.load();
    if (!data.economy) data.economy = {};

    const senderId   = interaction.user.id;
    const receiverId = target.id;

    if (!data.economy[senderId])   data.economy[senderId]   = { bank: 0, cash: 0, lastWork: null };
    if (!data.economy[receiverId]) data.economy[receiverId] = { bank: 0, cash: 0, lastWork: null };

    const senderEco   = data.economy[senderId];
    const receiverEco = data.economy[receiverId];

    // Must come from BANK, not on-hand cash
    if (senderEco.bank < amount) {
      return interaction.reply({
        content: `❌ Insufficient bank funds. Your bank holds **$${senderEco.bank.toLocaleString()}** but you tried to deposit **$${amount.toLocaleString()}**.\n-# Deposits must come from your bank balance, not on-hand cash. Use \`/balance\` to check.`,
        ephemeral: true
      });
    }

    senderEco.bank   -= amount;
    receiverEco.bank += amount;
    db.save(data);

    const embed = new EmbedBuilder()
      .setTitle("🏦 Deposit Successful")
      .setColor(0x57F287)
      .addFields(
        { name: "From",      value: interaction.user.tag,         inline: true },
        { name: "To",        value: target.tag,                   inline: true },
        { name: "Amount",    value: `$${amount.toLocaleString()}`, inline: true },
        { name: "Your Bank", value: `$${senderEco.bank.toLocaleString()}`, inline: true }
      );

    // DM the receiver
    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("💸 You received a deposit!")
            .setColor(0x57F287)
            .addFields(
              { name: "From",       value: interaction.user.tag,          inline: true },
              { name: "Amount",     value: `$${amount.toLocaleString()}`,  inline: true },
              { name: "Your Bank",  value: `$${receiverEco.bank.toLocaleString()}`, inline: true }
            )
        ]
      });
    } catch {}

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

const { SlashCommandBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages (Staff only)")
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("Number of messages to delete (1–100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const amount = interaction.options.getInteger("amount");

    try {
      await interaction.channel.bulkDelete(amount, true);
    } catch {
      return interaction.reply({ content: "❌ Failed — messages may be older than 14 days.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
  }
};

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send a message as the bot (Staff only)")
    .addStringOption(o =>
      o.setName("message")
        .setDescription("The message to send")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.editReply({ content: "❌ You do not have permission to use this command." });
    }

    const message = interaction.options.getString("message");

    await interaction.channel.send({ content: message });
    await interaction.editReply({ content: "✅ Message sent." });
  }
};

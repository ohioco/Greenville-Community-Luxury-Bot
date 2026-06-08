const { SlashCommandBuilder } = require("discord.js");

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
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", flags: 64 });
    }

    const message = interaction.options.getString("message");

    await interaction.channel.send({ content: message });
    await interaction.reply({ content: "✅ Message sent.", flags: 64 });
  }
};

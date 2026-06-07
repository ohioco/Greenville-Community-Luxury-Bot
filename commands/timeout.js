const { SlashCommandBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member (Staff only)")
    .addUserOption(o =>
      o.setName("user").setDescription("User to timeout").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason for timeout").setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const target  = interaction.options.getMember("user");
    const minutes = interaction.options.getInteger("minutes");
    const reason  = interaction.options.getString("reason") ?? "No reason provided";

    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: "❌ I cannot timeout this user.", ephemeral: true });

    await target.timeout(minutes * 60 * 1000, reason);
    await interaction.reply({ content: `✅ **${target.user.tag}** has been timed out for **${minutes}** minute(s). Reason: ${reason}`, ephemeral: true });
  }
};

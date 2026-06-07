const { SlashCommandBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member (Staff only)")
    .addUserOption(o =>
      o.setName("user").setDescription("User to kick").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason for kick").setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: "❌ I cannot kick this user.", ephemeral: true });

    await target.kick(reason);
    await interaction.reply({ content: `✅ **${target.user.tag}** has been kicked. Reason: ${reason}`, ephemeral: true });
  }
};

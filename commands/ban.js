const { SlashCommandBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member (Staff only)")
    .addUserOption(o =>
      o.setName("user").setDescription("User to ban").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason for ban").setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const target = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
    if (!target.bannable) return interaction.reply({ content: "❌ I cannot ban this user.", ephemeral: true });

    await target.ban({ reason });
    await interaction.reply({ content: `✅ **${target.user.tag}** has been banned. Reason: ${reason}`, ephemeral: true });
  }
};

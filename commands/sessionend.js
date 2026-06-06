const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sessionend")
    .setDescription("End the current RP session (Staff only)"),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const host = interaction.client.sessionHost
      ? `<@${interaction.client.sessionHost}>`
      : interaction.user.toString();
    const coHost = interaction.client.sessionCoHost
      ? `\n➜ **Co-Host:** <@${interaction.client.sessionCoHost}>` : "";

    // Clear session state
    interaction.client.sessionHost      = null;
    interaction.client.sessionCoHost    = null;
    interaction.client.sessionLink      = null;
    interaction.client.sessionFrpSpeed  = null;
    interaction.client.sessionPeacetime = null;
    interaction.client.sessionHC        = null;
    interaction.client.reinviteLink     = null;
    interaction.client.reinviteReleased = false;

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Session Ended 🔴")
      .setDescription(
`<@&1508054312075526204>

➜ The session hosted by **${host}** has now ended. Thank you for participating!${coHost}

➜ We hope to see you in the next session. Stay safe and have a great day!

-# Keep an eye out for future session announcements.`
      )
      .setColor(0xFF5555)
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sessionend")
    .setDescription("End the current RP session (Staff only)")
    .addStringOption(option =>
      option.setName("notes")
        .setDescription("Optional session notes")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const host = interaction.client.sessionHost
      ? `<@${interaction.client.sessionHost}>`
      : interaction.user.toString();

    const coHostLine = interaction.client.sessionCoHost
      ? `\n➜ **Co-Host:** <@${interaction.client.sessionCoHost}>` : "";

    const endTime   = Math.floor(Date.now() / 1000);
    const startTime = interaction.client.sessionStartTime ?? null;
    const duration  = startTime
      ? Math.round((endTime - startTime) / 60)
      : null;

    const notes = interaction.options.getString("notes") ?? interaction.client.sessionNotes ?? "N/A";

    // Clear all session state
    interaction.client.sessionHost      = null;
    interaction.client.sessionCoHost    = null;
    interaction.client.sessionLink      = null;
    interaction.client.sessionFrpSpeed  = null;
    interaction.client.sessionPeacetime = null;
    interaction.client.sessionHC        = null;
    interaction.client.reinviteLink     = null;
    interaction.client.reinviteReleased = false;
    interaction.client.sessionStartTime = null;
    interaction.client.sessionNotes     = null;

    const startLine  = startTime ? `<t:${startTime}:t>` : "N/A";
    const endLine    = `<t:${endTime}:t>`;
    const durLine    = duration !== null ? `${duration}m` : "N/A";

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Session Ended 🔴")
      .setColor(BABY_BLUE)
      .setDescription(
`<@&1508054312075526204>

➜ The Greenville Roleplay Rural session hosted by ${host} has now concluded.
Thank you to everyone who attended. Please wait for the next session announcement before continuing roleplay activity.${coHostLine}

**Session Information**
➜ **Host:** ${host}
➜ **Start Time:** ${startLine}
➜ **End Time:** ${endLine}
➜ **Duration:** ${durLine}
➜ **Notes:** ${notes}

-# Keep an eye out for future session announcements.`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
    await interaction.channel.send({ embeds: [embed] });
  }
};

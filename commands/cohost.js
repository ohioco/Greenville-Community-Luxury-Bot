const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cohost")
    .setDescription("Assign a session co-host (Staff only)")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("The co-host to assign")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const coHost = interaction.options.getUser("user");
    interaction.client.sessionCoHost = coHost.id;

    const host = interaction.client.sessionHost
      ? `<@${interaction.client.sessionHost}>`
      : "No host set";

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Session Co-Host 💚")
      .setDescription(
`<@&1508054312075526204>

➜ **${coHost}** is co-hosting the session!

➜ **Host:** ${host}
➜ **Co-Host:** ${coHost}

➜ If you need support and the host is busy, please redirect to the co-host.`
      )
      .setColor(0x89CFF0)
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

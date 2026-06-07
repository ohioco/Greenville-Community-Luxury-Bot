const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("alliances")
    .setDescription("Post the server alliances info (Staff only)"),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Server Alliances")
      .setColor(BABY_BLUE)
      .setImage("https://i.ibb.co/1w0QyH6/Untitled137-20260531234110.png")
      .setDescription(
`Welcome to **Greenville Community Luxury's** Server Alliances. Within our server, we strive to support all roleplay communities in their growth and success.

However, before partnering with our server, you must meet our partnership requirements. All relevant partnership information is listed below.

➜ Active Community Members.
➜ Greenville or Roblox Roleplay Related.
➜ Good Server & Management Reputation.
➜ Organized Server & Departments.`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Server Alliances" })
      .setTimestamp();

    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
    await interaction.channel.send({ embeds: [embed] });
  }
};

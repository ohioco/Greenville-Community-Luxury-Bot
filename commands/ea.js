const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { saveLink } = require("../sessionStore");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

const EA_ROLES = [
  "1510346654241394848",
  // Add more EA role IDs here
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ea")
    .setDescription("Send Early Access link (Staff only)")
    .addStringOption(o =>
      o.setName("link").setDescription("Early Access session link").setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const link    = interaction.options.getString("link");
    const linkKey = saveLink(link);

    const host = interaction.client.sessionHost
      ? `<@${interaction.client.sessionHost}>`
      : interaction.user.toString();
    const coHostLine = interaction.client.sessionCoHost
      ? `\n➜ **Co-Host:** <@${interaction.client.sessionCoHost}>` : "";

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Early Access ⭐")
      .setColor(BABY_BLUE)
      .setDescription(
`<@&1508054312075526204>

⭐ **Early Access is now open!**

➜ **Host:** ${host}${coHostLine}

➜ Staff, Early Access members, Contributors & P/S may now join using the button below. Please allow the host up to **10 minutes** to fully release the session. Do not bother the host during setup.

-# Click the button below to access the Early Access link.`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ea_link_${linkKey}`)
        .setLabel("🔗 Early Access Link")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};

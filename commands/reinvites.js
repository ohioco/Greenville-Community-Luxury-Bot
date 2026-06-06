const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const STAFF_ROLE = "1510346654241394848";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reinvites")
    .setDescription("Open reinvites for the session (Staff only)")
    .addStringOption(o =>
      o.setName("link")
        .setDescription("New session link for reinvites")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("reactions")
        .setDescription("Reactions needed before the link is revealed")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const newLink         = interaction.options.getString("link");
    const reactionsNeeded = interaction.options.getInteger("reactions");

    const host = interaction.client.sessionHost
      ? `<@${interaction.client.sessionHost}>`
      : interaction.user.toString();
    const coHost = interaction.client.sessionCoHost
      ? `\n➜ **Co-Host:** <@${interaction.client.sessionCoHost}>` : "";

    // Carry over session info if available
    const frpSpeed  = interaction.client.sessionFrpSpeed  ? `**${interaction.client.sessionFrpSpeed} MPH**` : "N/A";
    const peacetime = interaction.client.sessionPeacetime ?? "N/A";
    const hc        = interaction.client.sessionHC        ?? "N/A";

    const encodedLink = Buffer.from(newLink).toString("base64");

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Reinvites Open 🔄")
      .setDescription(
`<@&1508054312075526204>

➜ **${host}** is now accepting reinvites!${coHost}

📋 **| Session Information**
➜ Peacetime Status: **${peacetime}**
➜ Fail Roleplay Speeds: ${frpSpeed}
➜ Highway Code: **${hc}**

-# Once **${reactionsNeeded}+** reactions are reached, the new session link will be released. React ✅ below!`
      )
      .setColor(0x5865F2)
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    // Store reinvite state on client so the reaction watcher can release the link
    interaction.client.reinviteLink      = newLink;
    interaction.client.reinviteReactions = reactionsNeeded;
    interaction.client.reinviteReleased  = false;

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    await message.react("✅");

    // Watch for reaction count
    const filter = (reaction, user) =>
      reaction.emoji.name === "✅" && !user.bot;

    const collector = message.createReactionCollector({ filter, time: 3_600_000 }); // 1 hour max

    collector.on("collect", async () => {
      const count = message.reactions.cache.get("✅")?.count ?? 0;
      if (!interaction.client.reinviteReleased && count >= reactionsNeeded) {
        interaction.client.reinviteReleased = true;
        collector.stop("threshold_met");

        const releaseEmbed = new EmbedBuilder()
          .setTitle("Greenville Community Luxury™ | Session Link Released 🔗")
          .setDescription(
`<@&1508054312075526204>

➜ The reaction goal has been met! The new session link is now available.
➜ **Host:** ${host}${coHost}

-# Click the button below to access the new session link.`
          )
          .setColor(0x57F287)
          .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`reinvite_link_${encodedLink}`)
            .setLabel("🔗 New Session Link")
            .setStyle(ButtonStyle.Success)
        );

        await interaction.followUp({ embeds: [releaseEmbed], components: [row] });
      }
    });
  }
};

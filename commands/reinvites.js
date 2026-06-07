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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reinvites")
    .setDescription("Open reinvites for the session (Staff only)")
    .addStringOption(o =>
      o.setName("link").setDescription("New session link").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("reactions").setDescription("Reactions needed to release the link").setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addIntegerOption(o =>
      o.setName("frp_speed").setDescription("FRP speed (MPH) — auto-filled if /sessionlink was used").setRequired(false).setMinValue(1)
    )
    .addStringOption(o =>
      o.setName("peacetime").setDescription("Peacetime — auto-filled if /sessionlink was used").setRequired(false)
        .addChoices(
          { name: "Active", value: "🟢 Active" },
          { name: "Strict", value: "🟡 Strict" },
          { name: "Off",    value: "🔴 Off"    }
        )
    )
    .addStringOption(o =>
      o.setName("hc").setDescription("Highway Code — auto-filled if /sessionlink was used").setRequired(false)
        .addChoices(
          { name: "On",  value: "✅ On"  },
          { name: "Off", value: "❌ Off" }
        )
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const newLink         = interaction.options.getString("link");
    const reactionsNeeded = interaction.options.getInteger("reactions");
    const frpSpeed        = interaction.options.getInteger("frp_speed")  ?? interaction.client.sessionFrpSpeed  ?? null;
    const peacetime       = interaction.options.getString("peacetime")    ?? interaction.client.sessionPeacetime ?? null;
    const hc              = interaction.options.getString("hc")           ?? interaction.client.sessionHC        ?? null;

    const host = interaction.client.sessionHost
      ? `<@${interaction.client.sessionHost}>`
      : interaction.user.toString();
    const coHostLine = interaction.client.sessionCoHost
      ? `\n➜ **Co-Host:** <@${interaction.client.sessionCoHost}>` : "";

    const frpDisplay = frpSpeed  ? `**${frpSpeed} MPH**` : "**Not set**";
    const ptDisplay  = peacetime ?? "**Not set**";
    const hcDisplay  = hc       ?? "**Not set**";

    const linkKey = saveLink(newLink);
    interaction.client.reinviteReleased = false;

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Reinvites Open 🔄")
      .setColor(BABY_BLUE)
      .setDescription(
`<@&1508054312075526204>

➜ **${host}** is now accepting reinvites!${coHostLine}

📋 **| Session Information**
➜ Peacetime Status: ${ptDisplay}
➜ Fail Roleplay Speeds: ${frpDisplay}
➜ Highway Code: ${hcDisplay}

-# Once **${reactionsNeeded}+** reactions are reached, the new session link will be released. React ✅ below!`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
    const message = await interaction.channel.send({ embeds: [embed] });
    await message.react("✅");

    const filter = (reaction, user) => reaction.emoji.name === "✅" && !user.bot;
    const collector = message.createReactionCollector({ filter, time: 3_600_000 });

    collector.on("collect", async () => {
      const count = message.reactions.cache.get("✅")?.count ?? 0;
      if (!interaction.client.reinviteReleased && count >= reactionsNeeded) {
        interaction.client.reinviteReleased = true;
        collector.stop("threshold_met");

        const releaseEmbed = new EmbedBuilder()
          .setTitle("Greenville Community Luxury™ | Session Link Released 🔗")
          .setColor(BABY_BLUE)
          .setDescription(
`<@&1508054312075526204>

➜ The reaction goal has been met! The new session link is now available.
➜ **Host:** ${host}${coHostLine}

-# Click the button below to access the new session link.`
          )
          .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`reinvite_link_${linkKey}`)
            .setLabel("🔗 New Session Link")
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [releaseEmbed], components: [row] });
      }
    });
  }
};

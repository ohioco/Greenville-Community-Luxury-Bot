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
    .setName("sessionlink")
    .setDescription("Release the session link to everyone (Staff only)")
    .addStringOption(o =>
      o.setName("link")
        .setDescription("Session link")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("frp_speed")
        .setDescription("Fail Roleplay speed limit (MPH)")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(o =>
      o.setName("peacetime")
        .setDescription("Peacetime status")
        .setRequired(true)
        .addChoices(
          { name: "Active",  value: "🟢 Active"  },
          { name: "Strict",  value: "🟡 Strict"  },
          { name: "Off",     value: "🔴 Off"      }
        )
    )
    .addStringOption(o =>
      o.setName("hc")
        .setDescription("Highway Code enforcement")
        .setRequired(true)
        .addChoices(
          { name: "On",  value: "✅ On"  },
          { name: "Off", value: "❌ Off" }
        )
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const link      = interaction.options.getString("link");
    const frpSpeed  = interaction.options.getInteger("frp_speed");
    const peacetime = interaction.options.getString("peacetime");
    const hc        = interaction.options.getString("hc");

    const host = interaction.client.sessionHost
      ? `<@${interaction.client.sessionHost}>`
      : interaction.user.toString();
    const coHost = interaction.client.sessionCoHost
      ? `\n➜ **Co-Host:** <@${interaction.client.sessionCoHost}>` : "";

    // Save link on client for /reinvites to use
    interaction.client.sessionLink      = link;
    interaction.client.sessionFrpSpeed  = frpSpeed;
    interaction.client.sessionPeacetime = peacetime;
    interaction.client.sessionHC        = hc;

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Session Released ⭐")
      .setDescription(
`<@&1508054312075526204>

➜ The host, **${host}**, has now released their session! Upon joining the session, please spawn your vehicles & park within the marked bays, and wait for further instructions from the host.${coHost}

📋 **| Session Information**
➜ Peacetime Status: **${peacetime}**
➜ Fail Roleplay Speeds: **${frpSpeed} MPH**
➜ Highway Code: **${hc}**

-# Click the button below to access the session link.`
      )
      .setColor(0x57F287)
      .setFooter({ text: "Greenville Community Luxury™ | Session Management" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`session_link_${Buffer.from(link).toString("base64")}`)
        .setLabel("🔗 Session Link")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};

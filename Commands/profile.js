const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your RP profile"),

  async execute(interaction) {
    const data = db.load();
    const id   = interaction.user.id;

    // Summary counts
    const warrants = (data.warrants || {})[id] || [];
    const tickets  = (data.tickets  || {})[id] || [];
    const vehicles = (data.vehicles || {})[id] || [];
    const eco      = (data.economy  || {})[id]  || { bank: 0, cash: 0 };

    const embed = new EmbedBuilder()
      .setTitle(`🪪 RP Profile — ${interaction.user.username}`)
      .setColor(0x89CFF0)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: "⚖️ Warrants",    value: `${warrants.length}`,              inline: true },
        { name: "🎫 Tickets",     value: `${tickets.length}`,               inline: true },
        { name: "🚗 Vehicles",    value: `${vehicles.length}`,              inline: true },
        { name: "💰 Balance",     value: `$${(eco.bank + eco.cash).toLocaleString()}`, inline: true }
      )
      .setDescription("Use the buttons below to view details.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("profile_warrants")
        .setLabel("⚖️ Warrants")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("profile_tickets")
        .setLabel("🎫 Tickets")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("profile_vehicles")
        .setLabel("🚗 Vehicles")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("profile_economy")
        .setLabel("💰 Balance")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your RP profile"),

  async execute(interaction) {
    const data = db.load();
    const id = interaction.user.id;

    const vehicles = data.vehicles[id] || [];
    const warrants = data.warrants[id] || [];

    const embed = new EmbedBuilder()
      .setTitle(`Profile - ${interaction.user.username}`)
      .setColor(0x89CFF0)
      .addFields(
        { name: "Vehicles", value: vehicles.length ? vehicles.map(v => `${v.brand} ${v.model}`).join("\n") : "None" },
        { name: "Warrants", value: warrants.length ? warrants.join("\n") : "None" }
      );

    await interaction.reply({ embeds: [embed] });
  }
};

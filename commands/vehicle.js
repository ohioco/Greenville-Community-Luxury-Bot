const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vehicle")
    .setDescription("Register a vehicle")

    .addStringOption(o =>
      o
        .setName("brand")
        .setDescription("Vehicle brand") // REQUIRED
        .setRequired(true)
    )

    .addStringOption(o =>
      o
        .setName("model")
        .setDescription("Vehicle model") // REQUIRED
        .setRequired(true)
    )

    .addStringOption(o =>
      o
        .setName("color")
        .setDescription("Vehicle color") // REQUIRED
        .setRequired(true)
    )

    .addStringOption(o =>
      o
        .setName("plate")
        .setDescription("Vehicle plate number") // REQUIRED
        .setRequired(true)
    ),

  async execute(interaction) {
    const data = db.load();
    if (!data.vehicles) data.vehicles = {};

    const id = interaction.user.id;

    if (!data.vehicles[id]) data.vehicles[id] = [];

    const vehicle = {
      brand: interaction.options.getString("brand"),
      model: interaction.options.getString("model"),
      color: interaction.options.getString("color"),
      plate: interaction.options.getString("plate")
    };

    data.vehicles[id].push(vehicle);
    db.save(data);

    const embed = new EmbedBuilder()
      .setTitle("Vehicle Registered")
      .setColor(0x89CFF0)
      .addFields(
        { name: "Brand", value: vehicle.brand, inline: true },
        { name: "Model", value: vehicle.model, inline: true },
        { name: "Color", value: vehicle.color, inline: true },
        { name: "Plate", value: vehicle.plate, inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

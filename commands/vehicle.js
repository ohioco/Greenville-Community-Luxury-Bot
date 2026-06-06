const { SlashCommandBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vehicle")
    .setDescription("Register a vehicle")

    .addStringOption(o =>
      o
        .setName("brand")
        .setDescription("Vehicle brand (e.g Toyota)")
        .setRequired(true)
    )

    .addStringOption(o =>
      o
        .setName("model")
        .setDescription("Vehicle model (e.g Supra)")
        .setRequired(true)
    )

    .addStringOption(o =>
      o
        .setName("color")
        .setDescription("Vehicle color")
        .setRequired(true)
    )

    .addStringOption(o =>
      o
        .setName("plate")
        .setDescription("Vehicle plate number")
        .setRequired(true)
    ),

  async execute(interaction) {
    const data = db.load();

    const id = interaction.user.id;

    if (!data.vehicles[id]) data.vehicles[id] = [];

    data.vehicles[id].push({
      brand: interaction.options.getString("brand"),
      model: interaction.options.getString("model"),
      color: interaction.options.getString("color"),
      plate: interaction.options.getString("plate")
    });

    db.save(data);

    await interaction.reply("🚗 Vehicle registered successfully!");
  }
};

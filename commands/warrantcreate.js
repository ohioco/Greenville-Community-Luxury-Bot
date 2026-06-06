const { SlashCommandBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warrant")
    .setDescription("Create warrant")
    .addUserOption(o => o.setName("user").setRequired(true))
    .addStringOption(o => o.setName("reason").setRequired(true)),

  async execute(interaction) {
    const data = db.load();
    if (!data.warrants) data.warrants = {};

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    if (!data.warrants[user.id]) data.warrants[user.id] = [];

    data.warrants[user.id].push(
      `Issued by ${interaction.user.tag}: ${reason}`
    );

    db.save(data);

    await interaction.reply(`⚖️ Warrant issued for ${user.tag}`);
  }
};

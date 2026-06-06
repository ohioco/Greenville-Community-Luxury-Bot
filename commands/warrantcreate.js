const { SlashCommandBuilder } = require("discord.js");
const db = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warrant")
    .setDescription("Create a warrant for a user")
    .addUserOption(o =>
      o.setName("user").setDescription("Target user").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Warrant reason").setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    const data = db.load();

    if (!data.warrants[user.id]) data.warrants[user.id] = [];

    data.warrants[user.id].push(
      `Warrant issued by ${interaction.user.tag}: ${reason}`
    );

    db.save(data);

    await interaction.reply({
      content: `Warrant created for ${user.tag}`,
      ephemeral: true
    });
  }
};

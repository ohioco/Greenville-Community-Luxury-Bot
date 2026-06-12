const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE = 0x89CFF0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveawaysembed")
    .setDescription("Send the Giveaways welcome embed (Staff only)"),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.editReply({ content: "❌ You do not have permission to use this command." });
    }

    const embed = new EmbedBuilder()
      .setTitle("__**Welcome to Greenville Community Luxury Giveaways!**__")
      .setColor(BABY_BLUE)
      .setDescription(
        `Welcome to **Greenville Community Luxury's** Server Giveaways. Within our server, we strive to give back to our community by hosting regular giveaways of Robux, Server Perks, Discord Nitro and More! All regular giveaways can be found within this channel if you're interested in sponsoring your server, please open a ticket.\n\n-# **Please Note:** That using __alternate accounts__ may result in __ban__ if you do not believe you were using alternate accounts please let us know before we make an action\n**If you have any questions or concerns, please let us know!**\n-# Greenville Community Luxury™`
      )
      .setFooter({ text: "Greenville Community Luxury™" });

    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({ content: "✅ Giveaways embed sent." });
  }
};

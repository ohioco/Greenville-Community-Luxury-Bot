const { EmbedBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (message.author.bot) return;
    if (message.content.toLowerCase() !== "?giveawaysembed") return;
    if (!message.member) return;

    if (!message.member.roles.cache.has(STAFF_ROLE)) {
      await message.delete().catch(() => {});
      return;
    }

    message.delete().catch(() => {});

const embed1 = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Server Alliances")
      .setColor(BABY_BLUE)
      .setImage("https://i.ibb.co/Pv6K4k9h/Untitled156-20260613230105.png");

    
    const embed2 = new EmbedBuilder()
      .setColor(BABY_BLUE)
      .setDescription(
`__**<:Bell:1515277260788203620> Welcome to Greenville Community Luxury Giveaways! <:Bell:1515277260788203620>**__

Welcome to **Greenville Community Luxury's** Server Giveaways. Within our server, we strive to give back to our community by hosting regular giveaways of Robux, Server Perks, Discord Nitro and More! All regular giveaways can be found within this channel. If you're interested in sponsoring your server, please open a ticket.

-# **Please Note:** <:Arrow:1515278896545665084> That using __alternate accounts__ may result in __ban__. If you do not believe you were using alternate accounts please let us know before we make an action.
**If you have any questions or concerns, please let us know!**
-# Greenville Community Luxury™`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Giveaways" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed1] [embed2] });
  },
};

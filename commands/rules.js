const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Post the server rules (Staff only)"),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Server Regulations")
      .setColor(BABY_BLUE)
      .setImage("https://i.ibb.co/MxGZYZ0b/Untitled137-20260602204131.png")
      .setDescription(
`Welcome to **Greenville Community Luxury**! We are a third-party Greenville Roleplay Server, which is civilian-centred to ensure a smooth and professional civilian experience within our server. Our server has many things to offer, including regular special roleplays, enabling our players to fully immerse themselves in the world of Greenville Roleplay!

__**Greenville Community Luxury™ | Server Regulations**__

**Rule __1__ ➜ Respectful Conduct:**
All members must treat each other with utmost respect, fostering an atmosphere of courtesy and inclusivity. Discrimination, hate speech, and personal attacks are strictly prohibited. Regardless of differences, maintaining a respectful and welcoming environment is paramount.

**Rule __2__ ➜ No Spamming:**
To ensure a clutter-free and organised communication experience, refrain from sending consecutive messages or posting irrelevant content. Only share information that aligns with the channel's purpose, contributing to meaningful discussions and interactions.

**Rule __3__ ➜ No Inappropriate Content:**
Sharing or posting sexually explicit, suggestive, violent, or age-inappropriate content is strictly forbidden. It is important to maintain a safe and comfortable space for members of all ages and backgrounds.

**Rule __4__ ➜ Confidentiality:**
Respect the privacy of all individuals within the community. Refrain from disclosing personal information, including phone numbers, addresses, or any other sensitive details about yourself or others. Protecting personal privacy is a priority.

**Rule __5__ ➜ No Unauthorized Advertising:**
Prior consent from server moderators or owners is necessary before promoting other Discord servers, websites, or services. Unsolicited advertising disrupts the community's focus and integrity. Obtain permission before sharing external content.

**Rule __6__ ➜ Channel-Specific Guidelines:**
In addition to the server-wide rules, each channel may have its specific guidelines. Familiarise yourself with and adhere to these guidelines to ensure a harmonious and well-organised environment within each channel.

**Rule __7__ ➜ No Hacking or Cheating:**
Engaging in hacking, cheating, or exploiting software or game vulnerabilities is strictly forbidden. Uphold fair play and maintain the integrity of the community's activities. Such actions undermine the experience for others and will not be tolerated.

**Rule __8__ ➜ No Impersonation:**
Avoid impersonating other members, staff, or well-known figures within the community. Misrepresenting oneself or others can lead to confusion, distrust, and disruptions. Be genuine and use your own identity in all interactions.

**Rule __9__ ➜ Staff Compliance:**
Promptly and respectfully follow instructions given by moderators and server staff. They are entrusted with maintaining order and ensuring a positive environment. Cooperation with staff contributes to a smooth and enjoyable community experience.

**Rule __10__ ➜ Discord Terms of Service:**
Ensure that you follow **[Discord TOS](https://discord.com/terms)** at all times within our server. Breaking Terms of Service will result in severe disciplinary action taken against you along with a report to Discord, if it is deemed necessary.`
      )
      .setFooter({ text: "Greenville Community Luxury™ | Server Regulations" })
      .setTimestamp();

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("rules_links")
        .setPlaceholder("🔗 Our Pages")
        .addOptions([
          {
            label: "GVCL TikTok Page",
            description: "This is the official TikTok Page",
            value: "tiktok",
            emoji: "🎵"
          }
        ])
    );

    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
    await interaction.channel.send({ embeds: [embed], components: [menu] });
  }
};

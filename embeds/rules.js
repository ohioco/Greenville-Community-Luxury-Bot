// embeds/rules.js
// FIX 1: message.member null-check added (crashes if partial member)
// FIX 2: delete trigger message before sending embed, not after, to avoid
//         the brief flash where both messages are visible
// FIX 3: permission denial no longer sends a public reply (deleted quietly)
// FIX 4: embed send now runs regardless of whether delete succeeds
// NOTE:  ?rules requires GatewayIntentBits.MessageContent in index.js — see bottom

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

const STAFF_ROLE = "1510346654241394848";
const BABY_BLUE  = 0x89CFF0;

module.exports = {
  name: "messageCreate",

  async execute(message) {
    if (message.author.bot) return;
    if (message.content.toLowerCase() !== "?rules") return;

    // FIX: message.member can be null for partial guild members
    if (!message.member) return;

    if (!message.member.roles.cache.has(STAFF_ROLE)) {
      // Delete trigger quietly — no public error reply that everyone sees
      await message.delete().catch(() => {});
      return;
    }

    // Delete trigger — catch error so embed still sends even if delete fails
    message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle("Greenville Community Luxury™ | Server Regulations")
      .setColor(BABY_BLUE)
      .setImage("https://i.ibb.co/qwGZFJ1/Untitled156-20260613211624.png")
      .setDescription(
`Welcome to <:flower:1515280493472518185> **Greenville Community Luxury** <:flower:1515280493472518185> ! We are a third-party Greenville Roleplay Server, which is civilian-centred to ensure a smooth and professional civilian experience within our server. Our server has many things to offer, including regular special roleplays, enabling our players to fully immerse themselves in the world of Greenville Roleplay!

__ <:manual:1515280559692054568> :**Greenville Community Luxury™ | Server Regulations** <:manual:1515280559692054568> __

**Rule __1__ <:Arrow:1515278896545665084>  Respectful Conduct:**
All members must treat each other with utmost respect, fostering an atmosphere of courtesy and inclusivity. Discrimination, hate speech, and personal attacks are strictly prohibited. Regardless of differences, maintaining a respectful and welcoming environment is paramount.

**Rule __2__ <:Arrow:1515278896545665084> No Spamming:**
To ensure a clutter-free and organised communication experience, refrain from sending consecutive messages or posting irrelevant content. Only share information that aligns with the channel's purpose, contributing to meaningful discussions and interactions.

**Rule __3__ <:Arrow:1515278896545665084> No Inappropriate Content:**
Sharing or posting sexually explicit, suggestive, violent, or age-inappropriate content is strictly forbidden. It is important to maintain a safe and comfortable space for members of all ages and backgrounds.

**Rule __4__ <:Arrow:1515278896545665084> Confidentiality:**
Respect the privacy of all individuals within the community. Refrain from disclosing personal information, including phone numbers, addresses, or any other sensitive details about yourself or others. Protecting personal privacy is a priority.

**Rule __5__ <:Arrow:1515278896545665084> No Unauthorized Advertising:**
Prior consent from server moderators or owners is necessary before promoting other Discord servers, websites, or services. Unsolicited advertising disrupts the community's focus and integrity. Obtain permission before sharing external content.

**Rule __6__ <:Arrow:1515278896545665084> Channel-Specific Guidelines:**
In addition to the server-wide rules, each channel may have its specific guidelines. Familiarise yourself with and adhere to these guidelines to ensure a harmonious and well-organised environment within each channel.

**Rule __7__ <:Arrow:1515278896545665084> No Hacking or Cheating:**
Engaging in hacking, cheating, or exploiting software or game vulnerabilities is strictly forbidden. Uphold fair play and maintain the integrity of the community's activities. Such actions undermine the experience for others and will not be tolerated.

**Rule __8__ <:Arrow:1515278896545665084>  No Impersonation:**
Avoid impersonating other members, staff, or well-known figures within the community. Misrepresenting oneself or others can lead to confusion, distrust, and disruptions. Be genuine and use your own identity in all interactions.

**Rule __9__ <:Arrow:1515278896545665084> Staff Compliance:**
Promptly and respectfully follow instructions given by moderators and server staff. They are entrusted with maintaining order and ensuring a positive environment. Cooperation with staff contributes to a smooth and enjoyable community experience.

**Rule __10__ <:Arrow:1515278896545665084> Discord Terms of Service:**
Ensure that you follow **[Discord TOS](https://discord.com/terms)** at all times within our server. Breaking Terms of Service will result in severe disciplinary action taken against you along with a report to Discord, if it is deemed necessary.`    )
      .setFooter({ text: "Greenville Community Luxury™ | Server Regulations" })
      .setTimestamp();

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("rules_links")
        .setPlaceholder("Greenville Community Luxury - Links")
        .addOptions([
          {
            label:       "GVCL TikTok Page",
            description: "This is the official TikTok Page",
            value:       "tiktok",
            emoji:       "📱",
          },
        ]),
    );

    await message.channel.send({ embeds: [embed], components: [menu] });
  },
};

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REQUIRED: add MessageContent to index.js intents or ?rules will never fire

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,   // ← ADD THIS
    ],
    ...
  });

  Also enable "Message Content Intent" in your app's Discord Developer Portal
  under Bot → Privileged Gateway Intents.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

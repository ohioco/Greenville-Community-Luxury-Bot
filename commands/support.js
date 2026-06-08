// commands/support.js
// Drop into /commands. Then wire up interactionCreate.js per the instructions at the bottom.

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPPORT_CONFIG = {
  TICKET_CATEGORY_ID: "YOUR_TICKET_CATEGORY_ID",
  STAFF_ROLE_ID:      "YOUR_STAFF_ROLE_ID",
  LOG_CHANNEL_ID:     "YOUR_LOG_CHANNEL_ID",
};
// ─────────────────────────────────────────────────────────────────────────────

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

const TICKET_TYPES = {
  general:  { label: "General Assistance",  color: 0x5865F2, prefix: "general",  pingStaff: false, description: "Use this ticket to ask questions about rules or sessions. You may also use this ticket to Request Partnerships, Claim Perks, or for Application Requests. This is not to be used to report someone."   },
  civilian: { label: "Civilian Report",     color: 0xED4245, prefix: "report",   pingStaff: true,  description: "Use this to report a Civilian who might be breaking the rules. Make sure to gather proof as it is necessary so that the High Command Team can take action."                                             },
  staff:    { label: "Staff Report",        color: 0xFEE75C, prefix: "staff",    pingStaff: true,  description: "Use this to report a Staff Member who might be breaking the rules. Make sure to gather proof as it is necessary so that the High Command Team can take action."                                         },
};

// userId -> channelId  (in-memory; resets on bot restart — acceptable for tickets)
const activeTickets = new Map();

// ── HELPERS ───────────────────────────────────────────────────────────────────
const cfg = SUPPORT_CONFIG;

function hasStaffRole(member) {
  return cfg.STAFF_ROLE_ID !== "YOUR_STAFF_ROLE_ID"
    ? member.roles.cache.has(cfg.STAFF_ROLE_ID)
    : member.permissions.has(PermissionFlagsBits.ManageChannels);
}

function ownerIdFromTopic(topic) {
  const m = topic?.match(/UID:(\d+)/);
  return m ? m[1] : null;
}

async function logAction(guild, { action, user, detail, color }) {
  if (cfg.LOG_CHANNEL_ID === "YOUR_LOG_CHANNEL_ID") return;
  const ch = guild.channels.cache.get(cfg.LOG_CHANNEL_ID);
  if (!ch) return;
  await ch.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`📋 ${action}`)
        .addFields(
          { name: "User",   value: `${user.tag} (${user.id})`, inline: true },
          { name: "Detail", value: detail ?? "—",              inline: true },
        )
        .setColor(color)
        .setTimestamp(),
    ],
  }).catch(console.error);
}

function ticketButtons(claimed = false, claimerName = "") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("support_claim")
      .setLabel(claimed ? `Claimed by ${claimerName}` : "Claim")
      .setStyle(claimed ? ButtonStyle.Success : ButtonStyle.Primary)
      .setEmoji(claimed ? "✅" : "🙋")
      .setDisabled(claimed),
    new ButtonBuilder()
      .setCustomId("support_close")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒"),
  );
}

// ── POST PANEL ────────────────────────────────────────────────────────────────
async function postPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("Welcome to the Greenville Community Luxury Support Directory!")
    .setDescription(
      "This channel allows you to request assistance, such as General Assistance, a Staff Report, or a Civilian Report. " +
      "If you are facing any issues within the server, please do not hesitate to make a ticket below!\n\n" +

      "> **General Assistance:**\n" +
      "> Use this support ticket to ask **questions** about rules or sessions. You may also use this ticket to **Request Partnerships, Claim Perks, or for Application Requests**. " +
      "This is not to be used to report someone, as there are other tickets to use that for.\n\n" +

      "> **Civilian Report:**\n" +
      "> Use this to report a **Civilian** who might be breaking the rules. Make sure to gather proof as it is necessary so that the server High Command Team can take action, " +
      "depending on the severity. If further support is needed, please request the Staff Member to assist you further.\n\n" +

      "> **Staff Report:**\n" +
      "> Use this to report a **Staff Member** who might be breaking the rules. Make sure to gather proof as it is necessary so that the server High Command Team can take action, " +
      "depending on the severity. If further support is needed, please request the High Command Member to assist you further.\n\n" +

      "-# If you do not respond to your ticket within **24 hours**, it will be automatically closed.",
    )
    .setColor(0x89CFF0)
    .setFooter({ text: "Greenville Community Luxury™ | Support" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("support_type_menu")
      .setPlaceholder("Select a support category...")
      .addOptions([
        { label: "General Assistance",  description: "Questions, partnerships, perks, applications",  value: "general"  },
        { label: "Civilian Report",     description: "Report a civilian breaking the rules",          value: "civilian" },
        { label: "Staff Report",        description: "Report a staff member breaking the rules",      value: "staff"    },
      ]),
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ── CREATE TICKET ─────────────────────────────────────────────────────────────
async function handleSelectMenu(interaction) {
  if (interaction.customId !== "support_type_menu") return false;

  const type       = interaction.values[0];
  const ticketType = TICKET_TYPES[type];
  const { guild, user } = interaction;

  // Duplicate check
  const existingId = activeTickets.get(user.id);
  if (existingId) {
    const existing = guild.channels.cache.get(existingId);
    if (existing) {
      return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });
    }
    activeTickets.delete(user.id); // stale entry, clean up
  }

  await interaction.deferReply({ ephemeral: true });

  const ticketNumber = Date.now().toString().slice(-5);

  const permissionOverwrites = [
    { id: guild.roles.everyone,        deny:  [PermissionFlagsBits.ViewChannel] },
    { id: user.id,                     allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    { id: interaction.client.user.id,  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
  ];

  if (ticketType.pingStaff && cfg.STAFF_ROLE_ID !== "YOUR_STAFF_ROLE_ID") {
    permissionOverwrites.push({
      id: cfg.STAFF_ROLE_ID,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const ticketChannel = await guild.channels.create({
    name:  `${ticketType.prefix}-${user.username}-${ticketNumber}`,
    type:  ChannelType.GuildText,
    parent: cfg.TICKET_CATEGORY_ID !== "YOUR_TICKET_CATEGORY_ID" ? cfg.TICKET_CATEGORY_ID : null,
    permissionOverwrites,
    // Compact topic keeps UID parsing simple and avoids spaces in the regex
    topic: `type:${type}|UID:${user.id}|ticket:${ticketNumber}`,
  });

  activeTickets.set(user.id, ticketChannel.id);

  const pingContent = ticketType.pingStaff && cfg.STAFF_ROLE_ID !== "YOUR_STAFF_ROLE_ID"
    ? `<@&${cfg.STAFF_ROLE_ID}> — New **${ticketType.label}** opened by ${user}`
    : `${user} — your ticket has been created!`;

  await ticketChannel.send({
    content: pingContent,
    embeds: [
      new EmbedBuilder()
        .setTitle(ticketType.label)
        .setDescription(
          `Welcome, ${user}!\n\n${ticketType.description}\n\n` +
          `Please describe your issue and a staff member will be with you shortly.\n\n` +
          `**Ticket ID:** \`${ticketNumber}\``,
        )
        .setColor(ticketType.color)
        .setTimestamp()
        .setFooter({ text: "Use the buttons below to manage this ticket." }),
    ],
    components: [ticketButtons()],
  });

  await logAction(guild, { action: "Ticket Opened", user, detail: ticketType.label, color: ticketType.color });
  await interaction.editReply({ content: `✅ Your ticket has been created: ${ticketChannel}` });
  return true;
}

// ── BUTTON ROUTER ─────────────────────────────────────────────────────────────
async function handleButton(interaction) {
  const { customId } = interaction;
  if (customId === "support_close") return handleClose(interaction);
  if (customId === "support_claim") return handleClaim(interaction);
  return false;
}

// ── CLOSE ─────────────────────────────────────────────────────────────────────
async function handleClose(interaction) {
  const { channel, guild, user } = interaction;

  const ownerId = ownerIdFromTopic(channel.topic);
  const isOwner = ownerId === user.id;

  if (!hasStaffRole(interaction.member) && !isOwner) {
    return interaction.reply({ content: "❌ You don't have permission to close this ticket.", ephemeral: true });
  }

  if (ownerId) activeTickets.delete(ownerId);

  await logAction(guild, { action: "Ticket Closed", user, detail: channel.name, color: 0xED4245 });
  await interaction.reply({ content: "🔒 Closing this ticket in **5 seconds**..." });
  setTimeout(() => channel.delete().catch(console.error), 5000);
  return true;
}

// ── CLAIM ─────────────────────────────────────────────────────────────────────
async function handleClaim(interaction) {
  if (!hasStaffRole(interaction.member)) {
    return interaction.reply({ content: "❌ Only staff can claim tickets.", ephemeral: true });
  }

  await interaction.update({ components: [ticketButtons(true, interaction.user.username)] });

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setDescription(`✅ This ticket has been claimed by ${interaction.user}`)
        .setColor(0x57F287)
        .setTimestamp(),
    ],
  });
  return true;
}

// ── COMMAND DEFINITION ────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Support ticket commands")
    .addSubcommand(sub => sub.setName("panel").setDescription("Post the support panel (staff only)"))
    .addSubcommand(sub => sub.setName("close").setDescription("Close the current support ticket")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "panel") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
      }
      await postPanel(interaction.channel);
      return interaction.reply({ content: "✅ Support panel posted!", ephemeral: true });
    }
    if (sub === "close") return handleClose(interaction);
  },

  // Exported for interactionCreate.js
  handleSelectMenu,
  handleButton,
  activeTickets,
};

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASTE INTO events/interactionCreate.js

  At the top of execute(), before any existing logic, add:

    const support = require("../commands/support");

  Then inside isStringSelectMenu():

    if (interaction.isStringSelectMenu()) {
      if (await support.handleSelectMenu(interaction)) return;   // ← add
      if (interaction.customId === "rules_links") { ... }
      return;
    }

  And inside isButton(), before the customId.startsWith("ea_link_") check:

    if (await support.handleButton(interaction)) return;   // ← add
    if (customId.startsWith("ea_link_")) { ... }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

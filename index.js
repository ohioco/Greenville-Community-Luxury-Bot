require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  
  partials: [Partials.Message, Partials.Reaction]
});

client.commands = new Collection();

// Session state
client.sessionHost      = null;
client.sessionCoHost    = null;
client.sessionLink      = null;
client.sessionFrpSpeed  = null;
client.sessionPeacetime = null;
client.sessionHC        = null;
client.reinviteLink     = null;
client.reinviteReleased = false;

// ── LOAD COMMANDS ─────────────────────────────────────────────────────────────
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ── LOAD EVENTS ───────────────────────────────────────────────────────────────
const eventFiles = fs.readdirSync("./events").filter(f => f.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ── LOAD EMBEDS (message commands) ───────────────────────────────────────────
const embedFiles = fs.readdirSync("./embeds").filter(f => f.endsWith(".js"));
for (const file of embedFiles) {
  const event = require(`./embeds/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}



client.once("clientReady", () => {
  console.log(`🚔 Greenville Community Luxury Online — ${client.user.tag}`);
  client.user.setPresence({
    activities: [],
    status: "online"
  });
});

client.login(process.env.TOKEN);

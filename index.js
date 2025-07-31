const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { loadTrackedSubreddits } = require('./utils/dataUtils');  // Import loadTrackedSubreddits

// Initialize the client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

// Collection to hold commands
client.commands = new Collection();

// Load tracked subreddits from the JSON file
let trackedSubreddits = loadTrackedSubreddits();  // Load tracked subreddits into memory

// Command handling
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Event handling
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, trackedSubreddits));  // Pass tracked subreddits to events
    } else {
        client.on(event.name, (...args) => event.execute(...args, client, trackedSubreddits));   // Pass tracked subreddits to events
    }
}


client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, value] = interaction.customId.split('_');
  const { loadTrackedSubreddits, saveTrackedSubreddits } = require('./utils/dataUtils');
  const { fetchPosts } = require('./utils/redditAPI');
  const trackedSubreddits = loadTrackedSubreddits();

  // Handle subreddit tracking buttons
  if (action === 'track') {
    trackedSubreddits.push(value);
    saveTrackedSubreddits(trackedSubreddits);
    await interaction.update({ content: `✅ Now tracking r/${value}!`, components: [] });
  }

  // Handle post filter buttons
  if (action === 'filter') {
    const subreddit = trackedSubreddits[0]; // Or let users pick which subreddit
    const posts = await fetchPosts(subreddit, value);
    if (posts.length === 0) {
      return interaction.update({ content: `❌ No ${value} posts found in r/${subreddit}.`, components: [] });
    }

    const postList = posts.slice(0, 3).map(post => `• [${post.data.title}](${post.data.url})`).join('\n');

    await interaction.update({
      content: `**Top 3 ${value.toUpperCase()} Posts in r/${subreddit}:**\n${postList}`, components: [],});
  }
});



// Login to Discord
client.login(token);

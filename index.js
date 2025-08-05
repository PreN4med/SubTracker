const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token } = require('./config.json');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('./utils/dataUtils');
const { fetchPosts } = require('./utils/redditAPI');

// Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Command collection
client.commands = new Collection();

// Load commands
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
      console.log(`[WARNING] Command at ${filePath} missing "data" or "execute" property.`);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Button interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, value] = interaction.customId.split('_');
  const trackedSubreddits = loadTrackedSubreddits();

  try {
    // Track subreddit button
    if (action === 'track') {
      if (!trackedSubreddits.includes(value)) {
        trackedSubreddits.push(value);
        saveTrackedSubreddits(trackedSubreddits);
        await interaction.update({ 
          content: `✅ Now tracking r/${value}!`, 
          components: [] 
        });
      } else {
        await interaction.update({ 
          content: `❌ r/${value} is already being tracked.`, 
          components: [] 
        });
      }
    }
    // Filter posts button
    else if (action === 'filter') {
      const posts = await fetchPosts(value.split('|')[0], value.split('|')[1]);
      if (posts.length === 0) {
        return await interaction.update({ 
          content: `❌ No ${value.split('|')[1]} posts found in r/${value.split('|')[0]}.`, 
          components: [] 
        });
      }
      const postList = posts.slice(0, 3).map(post => 
        `• [${post.data.title}](${post.data.url})`
      ).join('\n');
      await interaction.update({
        content: `**Top 3 ${value.split('|')[1].toUpperCase()} Posts in r/${value.split('|')[0]}:**\n${postList}`,
        components: []
      });
    }
    // Remove subreddit button
    else if (action === 'remove') {
      const updatedSubreddits = trackedSubreddits.filter(sub => sub !== value);
      saveTrackedSubreddits(updatedSubreddits);
      await interaction.update({
        content: `✅ Removed r/${value} from tracking!`,
        components: []
      });
    }
  } catch (error) {
    console.error('Button interaction error:', error);
    await interaction.reply({ 
      content: '❌ An error occurred while processing your request.', 
      ephemeral: true 
    });
  }
});


client.login(token);
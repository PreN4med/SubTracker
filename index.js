const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('./utils/dataUtils');
const { fetchPosts } = require('./utils/redditAPI');

// Initialize client with intents
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
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
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

// Button interaction handler with all features
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, ...values] = interaction.customId.split('_');
  const trackedSubreddits = loadTrackedSubreddits();

  try {
    // Handle subreddit selection
    if (action === 'subreddit') {
      const subreddit = values.join('_');
      const listsubredditsCmd = client.commands.get('listsubreddits');
      return listsubredditsCmd.showFilterOptions(interaction, subreddit);
    }

    // Handle filter selection
    if (action === 'filter') {
      const [subreddit, filterType] = values;
      const posts = await fetchPosts(subreddit, filterType);
      
      if (posts.length === 0) {
        return await interaction.update({
          content: `❌ No ${filterType} posts found in r/${subreddit}.`,
          components: createBackButton(subreddit)
        });
      }

      const postList = posts.slice(0, 3)
        .map(post => `• [${post.data.title}](${post.data.url})`)
        .join('\n');

      await interaction.update({
        content: `**Top 3 ${filterType.toUpperCase()} Posts in r/${subreddit}:**\n${postList}`,
        components: createBackButton(subreddit)
      });
    }

    // Handle back button
    if (action === 'back') {
      const subreddit = values.join('_');
      const listsubredditsCmd = client.commands.get('listsubreddits');
      return listsubredditsCmd.showFilterOptions(interaction, subreddit);
    }

    // Handle back to list
    if (action === 'backtolist') {
      const listsubredditsCmd = client.commands.get('listsubreddits');
      return listsubredditsCmd.execute(interaction);
    }

    // Track subreddit button
    if (action === 'track') {
      const subredditToTrack = values.join('_').toLowerCase();
      
      if (trackedSubreddits.includes(subredditToTrack)) {
        return await interaction.update({
          content: `❌ r/${subredditToTrack} is already tracked.`,
          components: []
        });
      }

      trackedSubreddits.push(subredditToTrack);
      saveTrackedSubreddits(trackedSubreddits);
      await interaction.update({
        content: `✅ Now tracking r/${subredditToTrack}!`,
        components: []
      });
    }

    // Remove subreddit button
    if (action === 'remove') {
      const subredditToRemove = values.join('_');
      const updatedSubreddits = trackedSubreddits.filter(sub => sub !== subredditToRemove);
      saveTrackedSubreddits(updatedSubreddits);
      await interaction.update({
        content: `✅ Removed r/${subredditToRemove} from tracking!`,
        components: []
      });
    }

    // Pagination handling
    if (action === 'page') {
      const page = parseInt(values[0]);
      const listsubredditsCmd = client.commands.get('listsubreddits');
      return listsubredditsCmd.showPage(interaction, page);
    }

  } catch (error) {
    console.error('Button interaction error:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your request.',
      ephemeral: true
    });
  }
});

// Helper function to create back button
function createBackButton(subreddit) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`back_${subreddit}`)
        .setLabel('← Back to Filters')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('backtolist')
        .setLabel('← Back to Subreddit List')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

client.login(token);
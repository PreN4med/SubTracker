const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchSubredditSuggestions, validateSubreddit } = require('../../utils/redditAPI');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('../../utils/dataUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tracksubreddit')
    .setDescription('Track a subreddit')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Subreddit name to track')
        .setRequired(true)),
  async execute(interaction) {
    const inputSubreddit = interaction.options.getString('name').toLowerCase();
    const trackedSubreddits = loadTrackedSubreddits();

    // Check if already tracked
    if (trackedSubreddits.includes(inputSubreddit)) {
      return interaction.reply(`❌ r/${inputSubreddit} is already tracked.`);
    }

    // Validate subreddit
    const isValid = await validateSubreddit(inputSubreddit);
    if (isValid) {
      trackedSubreddits.push(inputSubreddit);
      saveTrackedSubreddits(trackedSubreddits);
      return interaction.reply(`✅ Now tracking r/${inputSubreddit}!`);
    }

    // Get suggestions if invalid
    const suggestions = await fetchSubredditSuggestions(inputSubreddit);
    if (suggestions.length === 0) {
      return interaction.reply('❌ Subreddit not found. No suggestions available.');
    }

    // 
    const buttons = suggestions.slice(0, 3).map(suggestion =>
      new ButtonBuilder()
        .setCustomId(`track_${suggestion}`) 
        .setLabel(`r/${suggestion}`)
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: `❌ r/${inputSubreddit} not found. Try these:`,
      components: [new ActionRowBuilder().addComponents(buttons)],
    });
  },
};
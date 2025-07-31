const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchSubredditSuggestions } = require('../../utils/redditAPI');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('../../utils/dataUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tracksubreddit') // Keep lowercase for Discord
    .setDescription('Track a subreddit for new posts')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Subreddit name (e.g., "dankmemes")')
        .setRequired(true)),
  async execute(interaction) {
    const subreddit = interaction.options.getString('name').toLowerCase();
    const trackedSubreddits = loadTrackedSubreddits();

    if (trackedSubreddits.includes(subreddit)) {
      return interaction.reply(`❌ r/${subreddit} is already tracked.`);
    }

    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/about.json`);
      if (response.ok) {
        trackedSubreddits.push(subreddit);
        saveTrackedSubreddits(trackedSubreddits);
        await interaction.reply(`✅ Now tracking r/${subreddit}!`);
      }
    } catch (error) {
      const suggestions = await fetchSubredditSuggestions(subreddit);
      if (suggestions.length === 0) {
        return interaction.reply('❌ Subreddit not found. No suggestions.');
      }

      const buttons = suggestions.slice(0, 3).map(suggestion => 
        new ButtonBuilder()
          .setCustomId(`track_${suggestion}`)
          .setLabel(`Track r/${suggestion}`)
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: `❌ r/${subreddit} not found. Track these instead?`,
        components: [new ActionRowBuilder().addComponents(buttons)],
      });
    }
  },
};
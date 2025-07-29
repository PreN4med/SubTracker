const { SlashCommandBuilder } = require('discord.js');
const { saveTrackedSubreddits, loadTrackedSubreddits } = require('../../utils/dataUtils');
const { validateSubreddit } = require('../../utils/validateSubreddit');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsubreddit')
        .setDescription('Add a subreddit to track')
        .addStringOption(option =>
            option.setName('subreddit')
                .setDescription('Name of the subreddit to track (e.g., "programming" or "r/programming")')
                .setRequired(true)),

    async execute(interaction) {
        const input = interaction.options.getString('subreddit');
        const { isValid, error, suggestions, normalized } = await validateSubreddit(input);

        if (!isValid) {
            let reply = `${error}\n`;
            if (suggestions.length > 0) {
                reply += `Did you mean: ${suggestions.map(s => `\`${s}\``).join(', ')}?`;
            } else {
                reply += 'No similar subreddits found.';
            }
            return interaction.reply(reply);
        }

        // Proceed if valid
        const trackedSubreddits = loadTrackedSubreddits();
        if (trackedSubreddits.trackedSubreddits.includes(normalized)) {
            return interaction.reply(`Subreddit \`${normalized}\` is already being tracked.`);
        }

        trackedSubreddits.trackedSubreddits.push(normalized);
        saveTrackedSubreddits(trackedSubreddits);
        return interaction.reply(`Subreddit \`${normalized}\` has been added.`);
    }
};
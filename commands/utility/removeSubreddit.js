const { SlashCommandBuilder } = require('discord.js');
const { loadTrackedSubreddits, saveTrackedSubreddits } = require('../../utils/dataUtils');
const { validateSubreddit } = require('../../utils/validateSubreddit');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removesubreddit')
        .setDescription('Remove a subreddit from the tracking list')
        .addStringOption(option =>
            option.setName('subreddit')
                .setDescription('Name of the subreddit (e.g., "programming")')
                .setRequired(true)),

    async execute(interaction) {
        const input = interaction.options.getString('subreddit');
        const { isValid, error, suggestions, normalized } = await validateSubreddit(input);

        if (!isValid) {
            let reply = `${error}\n`;
            reply += suggestions.length > 0 
                ? `Did you mean: ${suggestions.map(s => `\`${s}\``).join(', ')}?` 
                : 'No similar subreddits found.';
            return interaction.reply(reply);
        }

        const trackedSubreddits = loadTrackedSubreddits();
        const index = trackedSubreddits.trackedSubreddits.indexOf(normalized);

        if (index > -1) {
            trackedSubreddits.trackedSubreddits.splice(index, 1);
            saveTrackedSubreddits(trackedSubreddits);
            return interaction.reply(`Subreddit \`${normalized}\` has been removed.`);
        } else {
            return interaction.reply(`Subreddit \`${normalized}\` is not in the tracking list.`);
        }
    }
};
const { SlashCommandBuilder } = require('discord.js');
const { fetchLatestPost } = require('../../utils/redditAPI');
const { validateSubreddit } = require('../../utils/validateSubreddit');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getlatestpost')
        .setDescription('Get the latest post from a subreddit')
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

        const post = await fetchLatestPost(normalized);
        if (!post) {
            return interaction.reply(`Could not fetch posts from \`${normalized}\`. Does the subreddit exist?`);
        }

        return interaction.reply(
            `Latest post in /r/${normalized}:\n` +
            `**${post.title}** by u/${post.author}\n` +
            `${post.url}`
        );
    }
};
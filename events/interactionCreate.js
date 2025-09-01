const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, client) {
		// Handle slash commands
		if (interaction.isChatInputCommand()) {
			// Handle botstatus command specially
			if (interaction.commandName === 'botstatus') {
				const status = client.notificationPoller ? client.notificationPoller.getStatus() : null;
				
				if (!status) {
					return interaction.reply({
						content: '❌ Notification poller not initialized.',
						ephemeral: true
					});
				}

				const statusEmbed = {
					title: '🤖 Bot Status',
					fields: [
						{ name: '📊 Polling Status', value: status.isPolling ? '🟢 Active' : '🔴 Inactive', inline: true },
						{ name: '🏠 Total Guilds', value: status.totalGuilds.toString(), inline: true },
						{ name: '📺 Total Channels', value: status.totalChannels.toString(), inline: true },
						{ name: '🔔 Total Notifications', value: status.totalNotifications.toString(), inline: true },
						{ name: '⏱️ Poll Interval', value: `${status.pollInterval} minutes`, inline: true }
					],
					color: 0x00AE86,
					timestamp: new Date().toISOString()
				};

				await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
				return;
			}

			// Handle other commands
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
			}
		}

		// Handle button interactions
		if (interaction.isButton()) {
			const { loadTrackedSubreddits, saveTrackedSubreddits } = require('../utils/dataUtils');
			const { fetchPosts } = require('../utils/redditAPI');
			const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

			const customId = interaction.customId;
			const trackedSubreddits = loadTrackedSubreddits();
			
			try {
				// Handle filter selection - need special parsing due to underscores in subreddit names
				if (customId.startsWith('filter_')) {
					// Parse customId more carefully to handle underscores in subreddit names
					const filterMatch = customId.match(/^filter_(.+)_(top|hot|new)$/);
					
					if (!filterMatch) {
						return await interaction.reply({
							content: '❌ Invalid filter button format.',
							ephemeral: true
						});
					}

					const subreddit = filterMatch[1];
					const filterType = filterMatch[2];
					
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
					return;
				}

				
				const [action, ...values] = customId.split('_');

				// Handle subreddit selection
				if (action === 'subreddit') {
					const subreddit = values.join('_');
					const listsubredditsCmd = client.commands.get('listsubreddits');
					return listsubredditsCmd.showFilterOptions(interaction, subreddit);
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
					const subredditToTrack = values.join('_');
					
					if (trackedSubreddits.some(sub => sub.toLowerCase() === subredditToTrack.toLowerCase())) {
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
		}
	},
};

// Helper function to create back button
function createBackButton(subreddit) {
	const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
const { Events } = require('discord.js');
const NotificationPoller = require('../utils/notificationPoller');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		// Initialize and start notification poller
		client.notificationPoller = new NotificationPoller(client);
		client.notificationPoller.start();
	},
};
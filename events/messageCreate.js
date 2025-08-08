
module.exports = {
    name: 'messageCreate',
    async execute(message, client, trackedSubreddits) {
        if (!message.content.startsWith(client.prefix) || message.author.bot) return;

        const args = message.content.slice(client.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Load all available commands
        const command = client.commands.get(commandName);

        if (command) {
            try {
                await command.execute(message, args, trackedSubreddits);
            } catch (error) {
                console.error(error);
                message.reply('There was an error executing that command.');
            }
        }
    }
};

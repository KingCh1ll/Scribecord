import Discord, { ApplicationCommand, BaseInteraction, Client, Colors, CommandInteraction, Interaction, InteractionType } from "discord.js";
import statcord from "@zerotwobot/statcord.js";

import { commands } from "../app";
import config from "../config.json";
import logger from "../Modules/logger";

const cooldowns: any[] = [];

export default {
	once: false,
	async execute(bot: Client, interaction: CommandInteraction) {
		if (interaction.type === InteractionType.ApplicationCommand) {
			const command = commands.get(interaction.commandName);
			if (!command) return;

			if (!cooldowns[parseInt(interaction.user.id)]) cooldowns[parseInt(interaction.user.id)] = [];
			const time = cooldowns[parseInt(interaction.user.id)][command?.settings?.name as string] || 0;
			if (time && (time > Date.now())) return await interaction.reply({ content: `Please wait **${((time - Date.now()) / 1000 % 60).toFixed(2)} **more seconds to use that command again.`, ephemeral: true });

			cooldowns[parseInt(interaction.user.id)][command.settings.name as string] = Date.now() + (command?.settings?.cooldown as number);

			if (!command.settings.options) command.settings.options = [];
			if (command.settings.enabled === false) return await interaction.reply({ content: `${config.emojis.error} | This command is currently disabled! Please try again later.`, ephemeral: true });
			if (command.settings.guildOnly === true && interaction.inGuild() === false) return await interaction.reply({ content: "This command is guild only. Please join a server with DisScribe in it or invite DisScribe to your own server.", ephemeral: true });
			
			const hidden = (interaction.options as any).getBoolean("hidden") ?? false;
			await interaction.deferReply({ ephemeral: hidden });		

			statcord.ClusterClient.postCommand(command.settings.name as string, interaction.user.id, bot)

			try {
				await command.run(bot, interaction);
			} catch (error: any) {
				await interaction.editReply(`Uh oh! You encountered an ultra rare error. Please join the [Discord server](${config.bot.support}), create a new forum post, and send the following error.\n\`\`\`${error?.message?.slice(0, 1000)}\`\`\``);
				throw new Error(error.stack ?? error);
			}
		}
	}
};

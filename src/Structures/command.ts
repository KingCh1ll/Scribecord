import { ChannelType, Client, CommandInteraction, Message, PermissionResolvable } from "discord.js";

import config from "../config.json";
import { CommandOptions, CustomClient } from "../Structures/types";
import { GuildTypes } from "../Models/guild";

export default class Command {
	public execute: (client: CustomClient, interaction: CommandInteraction, data: { guild: GuildTypes }) => unknown;
	public settings: CommandOptions;

	constructor(execute: (client: CustomClient, interaction: CommandInteraction, data: { guild: GuildTypes }) => unknown, sett: CommandOptions) {
		this.execute = execute;
		this.settings = Object.assign({
			usage: "{command}",
			cooldown: 2 * 1000,
			ownerOnly: false,
			enabled: true
		}, sett, {
			perms: ["SendMessages"].concat(sett?.perms as string[] ?? []),
			bot_perms: ["UseExternalEmojis"].concat(sett?.bot_perms as string[] ?? [])
		});
	}

	public async run(bot: Client, message: CommandInteraction, data: { guild: GuildTypes }): Promise<unknown> {
		if (message?.channel?.type === ChannelType.DM) return await message.editReply(`${config.emojis.error} | This command cannot be used in DMs!`);

		const content = `${config.emojis.error} | Sorry, {user} missing the \`{missing}\` permission!`;
		if (message?.appPermissions?.has(this.settings.bot_perms as PermissionResolvable[]) !== true) return await message.editReply({
			content: content.replaceAll("{user}", "I'm")
			.replaceAll("{missing}", message?.appPermissions?.missing(this.settings.bot_perms ?? [])?.join(", ") as string)
		});

		if (message?.memberPermissions?.has(this.settings.perms as PermissionResolvable[]) !== true) return await message.editReply({
			content: content.replaceAll("{user}", "you're")
				.replaceAll("{missing}", message?.memberPermissions?.missing(this.settings.perms ?? [])?.join(", ") as string)
		});

		return this.execute(bot, message, data);
	}
};

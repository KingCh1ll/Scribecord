import Discord, { Colors, ActivityFlagsBitField, Client, BaseClient, GuildTextBasedChannel, Guild } from "discord.js";

import { formatNumber, serverCount, getChannelByIdAndSend } from "../Modules/functions";
import { CustomClient } from "../Structures/types";
import logger from "../Modules/logger";
import config from "../config.json";

export default {
	once: false,
	async execute(bot: CustomClient, guild: Guild) {
		if (!guild.available) return;
		logger("Guild Removed", `Scribecord has been removed from ${guild.name} (Id: ${guild.id}).`, "grey");

		const Owner = await guild?.fetchOwner().catch(() => null) ?? null;
		await getChannelByIdAndSend(bot.cluster, config.logger.guilds, {
			content: `🍂 Lost **${guild.name}** \`${guild.id}\` (-${formatNumber(guild.memberCount)}) by \`@${Owner?.user?.username}\`. Now in ${await serverCount(bot.cluster)} servers.`
		});
	}
};

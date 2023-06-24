import Discord, { Colors, ActivityFlagsBitField, Guild, Client, GuildTextBasedChannel } from "discord.js";

import { getChannelByIdAndSend } from "../Modules/functions";
import { formatNumber, serverCount } from "../Modules/functions";
import { CustomClient } from "../Structures/types";
import logger from "../Modules/logger";
import config from "../config.json";

export default {
	once: false,
	async execute(bot: CustomClient, guild: Guild) {
		if (!guild.available) return;
		logger("Guild Added", `Scribecord has been added to ${guild.name} (Id: ${guild.id}).`, "green");

		const Owner = await guild?.fetchOwner().catch(() => null) || null;
		await getChannelByIdAndSend(bot.cluster, config.logger.guilds, {
			content: `✨ Discovered [**\`${guild.name}\`**](https://discordlookup.com/guild/${guild.id}) (${formatNumber(guild.memberCount)}) by ${Owner?.user?.username}. Now in ${await serverCount(bot.cluster)} servers.`
		});

		if (guild.systemChannel) {
			const supportButton = { type: 2, emoji: config.emojis.question, label: "Support", url: config.bot.support, style: 5 };
			const websiteButton = { type: 2, emoji: config.emojis.globe, label: "Website", url: "https://scribecord.tk/", style: 5 };
			const InviteButton = { type: 2, emoji: config.emojis.plus, label: "Invite", url: config.bot.invite, style: 5 };

			await guild.systemChannel?.send({
				embeds: [{
					title: "Thanks for adding me!",
					description: `${config.emojis.info} | **About Scribecord**\n> I'm a powerful Discord bot with the purpose to intergrate your socials to Discord.\n> If you want to setup/configure Scribecord, run </config:1031199564767707178>.\n\n${config.emojis.award} | **Credits**\n> [Ch1llDev / KingCh1ll](https://ch1ll.dev/) • Creator and developer.\n> [Luna](https://lunish.nl/) • Many UI Ideas / Beta Tester.\n> [Danu](https://discord.gg/mm5QWaCWF5) • Made black and white icons.\n\n${config.emojis.question} | **Join Our Community!**\n> Feel free to join our [Discord server](https://discord.gg/PPtzT8Mu3h).`,
					thumbnail: { url: bot.user?.displayAvatarURL() as string },
					image: { url: "https://www.scribecord.tk/images/banner.gif" },
					color: Colors.Blue,
					timestamp: new Date().toISOString()
				}],
				components: [{ type: 1, components: [InviteButton, supportButton, websiteButton] }]
			}).catch(() => null);
		}
	}
};

import { CommandInteraction, Colors, PermissionsBitField, EmbedData, BaseGuildTextChannel, Channel, APIEmbed, TextChannel, ClientUser, GuildMember, PermissionResolvable, InteractionButtonComponentData, StringSelectMenuInteraction } from "discord.js";
import { inspect } from "util";
import os from "os";

import { convertTime, formatNumber, getChannelByIdAndSend, serverCount, userCount } from "../../Modules/functions";
import cmd from "../../Structures/command";
import LanguageHandler from "../../Languages/Handler";
import config from "../../config.json";
import { GuildTypes } from "../../Models/guild";
import { CustomClient } from "../../Structures/types";

const cooldowns: { id: string, sent: number }[] = [];

async function execute(bot: CustomClient, interaction: CommandInteraction, data: { guild: GuildTypes }) {
	const pages: APIEmbed[] = [];
	const i18n = new LanguageHandler({ language: data.guild.language ?? "en-US", command: "help" });

	/* -------------------------------------------------- CREATE MENU --------------------------------------------------*/
	pages.push({
		description: i18n.get("main.desc", [{
			name: "info",
			value: config.emojis.info
		}, {
			name: "slash",
			value: config.emojis.slash
		}, {
			name: "award",
			value: config.emojis.award
		}, {
			name: "question",
			value: config.emojis.question
		}, {
			name: "support",
			value: config.bot.support
		}]),
		color: Colors.Blurple,
		image: { url: "https://www.discribe.tk/images/banner.gif" },
	});

	/* -------------------------------------------------- CREATE STATS --------------------------------------------------*/
	const statcord = await fetch(`https://api.statcord.com/v3/${bot.user?.id}`).then(res => res.json()).then(body => body.data[0]).catch(() => null);
	pages.push({
		fields: [{
			name: i18n.get("stats.server.name"),
			value: i18n.get("stats.server.value", [{
				name: "rocket",
				value: config.emojis.rocket
			}, {
				name: "cpu",
				value: statcord?.cpuload ?? "0"
			}, {
				name: "stats",
				value: config.emojis.stats
			}, {
				name: "memory",
				value: (((os.totalmem() - os.freemem()) / (os.totalmem())) * 100).toFixed(2)
			}, {
				name: "clock",
				value: config.emojis.clock
			}, {
				name: "uptime",
				value: convertTime((bot.uptime ?? 0) as number, "short")
			}]),
			inline: true
		}, {
			name: i18n.get("stats.app.name"),
			value: i18n.get("stats.app.value", [{
				name: "globe",
				value: config.emojis.globe
			}, {
				name: "servers",
				value: await serverCount(bot.cluster)
			}, {
				name: "player",
				value: config.emojis.player
			}, {
				name: "users",
				value: formatNumber(await userCount(bot.cluster))
			}]),
			inline: true
		}],
		thumbnail: { url: bot.user?.displayAvatarURL() as string },
		image: { url: `https://dblstatistics.com/bot/${bot.user?.id}/widget/servers?width=1500&height=700&titleFontSize=20&labelFontSize=40&fillColor=0a1227?&lineColor=4752cc&backgroundColor=00000000` },
		color: Colors.Blurple
	});

	/* -------------------------------------------------- CREATE PERMISSIONS --------------------------------------------------*/
	const requiredPerms = ["SendMessages", "SendMessagesInThreads", "ViewChannel", "ManageMessages", "ManageEvents", "UseExternalEmojis"];
	let permDescription = "";
	Object.keys(PermissionsBitField.Flags).forEach(perm => {
		if (requiredPerms.filter(p => p === perm).length > 0) {
			const botMember = interaction?.guild?.members.cache.get(bot.user?.id as string) as GuildMember;
			if ((interaction.channel as TextChannel)?.permissionsFor(botMember?.id)?.has(perm as PermissionResolvable)) permDescription += `> ${config.emojis.success} ${perm}\n`;
			else permDescription += `> ${config.emojis.alert} **${perm}**\n`;
		}
	});

	pages.push({
		description: i18n.get("perms.desc", [{ name: "perms", value: permDescription }]),
		image: { url: "https://www.discribe.tk/images/banner.gif" },
		color: Colors.Blurple
	});

	/* -------------------------------------------------- SEND MESSAGE --------------------------------------------------*/
	const buttons = {
		type: 1,
		components: [{
			type: 2,
			emoji: config.emojis.plus,
			label: "Invite",
			url: config.bot.invite,
			style: 5
		}, {
			type: 2,
			emoji: config.emojis.globe,
			label: "Website",
			url: "https://discribe.tk/",
			style: 5
		}, {
			type: 2,
			emoji: config.emojis.mention,
			label: "Feedback",
			customId: "feedback",
			style: 2
		} as InteractionButtonComponentData]
	};
	interaction.user.id === config.owner && buttons.components.push({ type: 2, emoji: config.emojis.alert, label: "Eval", customId: "eval", style: 2 })

	const message = await interaction.editReply({
		embeds: [pages[0]],
		components: [{
			type: 1,
			components: [{
				type: 3,
				customId: "SelectHelpMenu",
				placeholder: i18n.get("main.placeholder"),
				options: [{
					label: i18n.get("stats.name"),
					description: i18n.get("stats.desc"),
					value: "stats",
					emoji: config.emojis.stats
				}, {
					label: i18n.get("perms.name"),
					description: i18n.get("perms.shortDesc"),
					value: "permissions",
					emoji: config.emojis.alert
				}, {
					label: i18n.get("main.name"),
					description: i18n.get("main.shortDesc"),
					value: "menu",
					emoji: config.emojis.leave
				}]
			}],
		}, buttons]
	});

	/* -------------------------------------------------- HANDLE SELECT MENU --------------------------------------------------*/
	const collector = message?.createMessageComponentCollector({ time: 300 * 1000 });
	collector.on("collect", async inter => {
		if ((inter as StringSelectMenuInteraction)?.values?.[0]) {
			const page = pages?.find(p => p?.footer?.text?.toLowerCase()?.includes((inter as StringSelectMenuInteraction)?.values?.[0]?.toLowerCase()));
			page && await inter.update({ embeds: [page] });
		} else if (inter?.customId === "feedback") {
			const cooldown = cooldowns.find(c => c.id === inter?.user?.id)?.sent ?? 0;
			if (cooldown && (cooldown > Date.now())) inter.followUp({ content: `You've already sent feedback recently! Please wait **${((cooldown - Date.now()) / 60000 % 60).toFixed(2)} minutes** and **${((cooldown - Date.now()) / 1000 % 60).toFixed(2)} seconds**.`, ephemeral: true });
			else {
				await inter?.showModal({
					title: i18n.get("feedback.name"),
					custom_id: 'feedback_modal',
					components: [{
						type: 1,
						components: [{
							type: 4,
							custom_id: "feedback_message",
							label: i18n.get("feedback.label"),
							style: 2,
							min_length: 15,
							max_length: 2000,
							required: true
						}]
					}]
				}).catch(() => null);

				const modal = await inter?.awaitModalSubmit({
					filter: inter => inter.user.id === inter.user.id,
					time: 300 * 1000
				}).catch(() => null);

				if (modal) {
					await modal.deferUpdate().catch(() => null);

					let formatDesc: string[] = [];
					let splitText = modal.fields?.getTextInputValue("feedback_message").split("\n");
					if (splitText) splitText.forEach((line: string) => formatDesc.push(`> ${line}`));
					else formatDesc.push(`> ${modal.fields?.getTextInputValue("feedback_message")}`);
	
					await getChannelByIdAndSend(bot.cluster, config.logger.feedback, {
						embeds: [{
							author: { name: inter.user.username, icon_url: inter.user.displayAvatarURL() },
							description: `${formatDesc.join("\n")}`,
							color: Colors.Blurple
						}]
					});
					cooldowns.push({ id: inter.user?.id, sent: Date.now() + 300000 });
				};
			}
		} else if (inter?.customId === "eval") {
			if (inter.user.id === config.owner) {
				await inter?.showModal({
					title: "Eval",
					custom_id: 'eval_modal',
					components: [{
						type: 1,
						components: [{
							type: 4,
							custom_id: "eval_content",
							label: "Eval",
							style: 2,
							min_length: 3,
							max_length: 2000,
							required: true
						}]
					}]
				}).catch(() => null);
	
				const modal = await inter?.awaitModalSubmit({
					filter: i => i.user.id === inter.user.id,
					time: 300 * 1000
				}).catch(() => { });
	
				if (modal) {
					await modal.deferUpdate().catch(() => null);
	
					const input = modal.fields.getTextInputValue("eval_content")
					let result;
					try {
						result = await eval(input.includes("return") || input.includes("await") ? `(async()=>{${input}})();` : input);
						if (typeof result !== "string") result = inspect(result, { depth: +!(inspect(result, { depth: 1 }).length > 1000) });
					} catch (err: any) { result = err.message; }
		
					await inter.followUp({ content: `\`\`\`js\n${result.slice(0, 1000)}\n\`\`\``, ephemeral: true });
				};
			};
		}
	});
	collector.on("end", async () => { await interaction?.editReply({ components: [] }) });
}

export default new cmd(execute, {
	description: "Get information on DisScribe, and how you can use it in your server!",
	options: [{
		type: 5,
		name: "hidden",
		description: "Whether or not this menu should be hidden.",
		choices: [{
			name: "hidden",
			value: "true"
		}, {
			name: "visible",
			value: "false"
		}]
	}]
});

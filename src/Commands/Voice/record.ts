import { AttachmentBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, Colors, CommandInteraction, CommandInteractionOptionResolver, ComponentType, InteractionButtonComponentData, InternalDiscordGatewayAdapterCreator } from "discord.js";
import { joinVoiceChannel, EndBehaviorType } from "@discordjs/voice";
import { FileWriter } from "wav";
import fs from "fs";
import prism from "prism-media";

import path from "path";

import cmd from "../../Structures/command";
import LanguageHandler from "../../Languages/Handler";
import { GuildTypes } from "../../Models/guild";
import { CustomClient } from "../../Structures/types";
import { wait } from "../../app";
import config from "../../config.json";

const tempDirectory = path.join(__dirname, "../", "../", "../", "../", "Temp/Record");
async function execute(bot: CustomClient, interaction: CommandInteraction, data: { guild: GuildTypes }) {
	const i18n = new LanguageHandler({ language: data.guild.language ?? "en-US", command: "record" });

	const effect = (interaction.options as CommandInteractionOptionResolver).getString("effect");
	const member = interaction.guild?.members.cache.get(interaction.user.id) || await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
	const connection = joinVoiceChannel({
		channelId: member?.voice?.channelId as string,
		guildId: interaction.guildId as string,
		adapterCreator: interaction.guild?.voiceAdapterCreator as InternalDiscordGatewayAdapterCreator,
		selfDeaf: false
	});

	const pauseButton: InteractionButtonComponentData = { type: 2, emoji: config.emojis.pause, label: i18n.get("buttons.pause"), customId: "pause", style: ButtonStyle.Danger }
	const resumeButton: InteractionButtonComponentData = { type: 2, emoji: config.emojis.play, label: i18n.get("buttons.resume"), customId: "pause", style: ButtonStyle.Success }
	const stopButton: InteractionButtonComponentData = { type: 2, emoji: config.emojis.stop, label: i18n.get("buttons.stop"), customId: "stop", style: ButtonStyle.Danger }

	const message = await interaction.editReply({
		embeds: [{
			description: i18n.get("started", [{ name: "alert", value: config.emojis.alert }]),
			color: Colors.Blurple
		}],
		components: [{
			type: 1,
			components: [pauseButton, stopButton]
		}]
	});

	let paused: boolean = false;
	let connections: any = [];
	let chunks: any = [];
	connection.receiver.speaking.on("start", async (id) => {
		if (connections[id as keyof typeof connections]) return;
		connections[id as keyof typeof connections] = connection.receiver
			.subscribe(id, { end: { behavior: EndBehaviorType.Manual } })
			.pipe(new prism.opus.Decoder({ rate: 48000, channels: 1, frameSize: 960 }))
			.on("data", chunk => paused !== true && chunks.push(chunk))
	});

	const collector = message?.createMessageComponentCollector({
		filter: async i => {
			if (i.user.id !== interaction.user.id) await i.reply({ content: `Only ${interaction.user} can edit these settings!`, ephemeral: true });
			return i.user.id === interaction.user.id;
		}, time: 120 * 1000
	});

	if (!collector) return;
	collector.on("collect", async inter => {
		await inter.deferUpdate();

		if (inter.customId === "stop") collector.stop();
		else if (inter.customId === "pause") {
			if (paused === true) {
				paused = false;
				await interaction.editReply({
					embeds: [{
						description: i18n.get("started", [{ name: "alert", value: config.emojis.alert }]),
						color: Colors.Yellow
					}],
					components: [{
						type: 1,
						components: [pauseButton, stopButton]
					}]
				});
			} else {
				paused = true;
				await interaction.editReply({
					embeds: [{
						description: i18n.get("paused", [{ name: "alert", value: config.emojis.alert }]),
						color: Colors.Yellow
					}],
					components: [{
						type: 1,
						components: [resumeButton, stopButton]
					}]
				});
			}
		}
	});

	collector.on("end", () => {
		connection.destroy();

		const ID = `${interaction?.guildId}_${Date.now()}.wav`;
		const bufferData = Buffer.concat(chunks);
		const writer = new FileWriter(path.join(tempDirectory, `/${ID}`), {
			channels: effect === "chipmunk" ? 2 : 1,
			sampleRate: 48000,
			bitDepth: 16,
		});
		writer.write(bufferData);
		writer.end();
		writer.on("done", async () => {
			const attachment = new AttachmentBuilder(path.join(tempDirectory, `/${ID}`), { name: "record.wav" });
			await interaction.editReply({
				embeds: [{
					description: `${config.emojis.alert} • Recording complete. The file is available below!`,
					color: Colors.Yellow
				}],
				components: [],
				files: [attachment]
			});
		});
	});
}

export default new cmd(execute, {
	description: "Generate a transcript for the VC.",
	options: [{
		type: 3,
		name: "effect",
		description: "Add an voice effect to you.",
		choices: [{
			name: "chipmunk",
			value: "chipmunk"
		}]
	}]
});

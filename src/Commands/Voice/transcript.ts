import { Collection, Colors, CommandInteraction, CommandInteractionOptionResolver, InternalDiscordGatewayAdapterCreator } from "discord.js";
import { joinVoiceChannel, EndBehaviorType, VoiceConnection } from "@discordjs/voice";
import { FileWriter } from "wav";
import fs from "fs";
import prism from "prism-media";
import path from "path";

import cmd from "../../Structures/command";
import LanguageHandler from "../../Languages/Handler";
import { GuildTypes } from "../../Models/guild";
import { CustomClient } from "../../Structures/types";
import config from "../../config.json";
import { speechText } from "../../Modules/vtt";

const tempDirectory = path.join(__dirname, "../", "../", "../", "../", "Temp/VTT");
const playing = new Collection<string, VoiceConnection>();

async function execute(bot: CustomClient, interaction: CommandInteraction) {
	const i18n = new LanguageHandler({ language: "en-US", command: "transcript" });

	const member = interaction.guild?.members.cache.get(interaction.user.id) || await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
	const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();

	if (subcommand === "start") {
		if (playing.get(interaction?.guildId as string)) return interaction.editReply(i18n.get("current", [{
			name: "alert",
			value: config.emojis.alert
		}, {
			name: "user",
			value: playing.get(interaction?.guildId as string) as any
		}]))
		if (!interaction.guild?.voiceAdapterCreator) return;

		const member = interaction.guild?.members.cache.get(interaction.user.id) ?? await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
		if (!member?.voice.channelId) return await interaction.editReply(i18n.get("perms.voice", [{ name: "alert", value: config.emojis.alert }]));
		if (!interaction.guild?.members.me?.permissionsIn(member.voice.channelId).has(["ViewChannel", "Connect", "Speak"])) return await interaction.editReply(i18n.get("perms.voice", [{ name: "alert", value: config.emojis.alert }]));
		if (!interaction.guild?.members.me?.permissionsIn(interaction.channel?.id ?? "").has(["ViewChannel", "SendMessages"])) return await interaction.editReply(i18n.get("perms.channel", [{ name: "alert", value: config.emojis.alert }]));

		const connection = joinVoiceChannel({
			channelId: member?.voice?.channelId as string,
			guildId: interaction.guildId as string,
			adapterCreator: interaction.guild?.voiceAdapterCreator as InternalDiscordGatewayAdapterCreator,
			selfDeaf: false
		});
		playing.set(interaction?.guildId as string, connection);

		await interaction.editReply({
			embeds: [{
				description: i18n.get("transcript.started", [{ name: "alert", value: config.emojis.alert }]),
				color: Colors.Blurple
			}]
		});

		let connections: any = [];
		let chunks: any = {};
		connection.receiver.speaking.on("start", async (id) => {
			const user = interaction.guild?.members.cache.get(id) ?? await interaction.guild?.members.fetch(id).catch(() => null);
			console.log(user?.user.username ?? id, "is now speaking.");

			if (connections[id as keyof typeof connections]) return;
			connections[id as keyof typeof connections] = connection.receiver
				.subscribe(id, { end: { behavior: EndBehaviorType.Manual } })
				.pipe(new prism.opus.Decoder({ rate: 48000, channels: 1, frameSize: 960 }))
				.on("data", chunk => {
					if (chunks[id as keyof typeof chunks] === undefined) chunks[id as keyof typeof chunks] = [];
					if (chunks[id as keyof typeof chunks].length < 250) return chunks[id as keyof typeof chunks]?.push(chunk);

					const ID = `${interaction?.guildId}_${Date.now()}.wav`;
					const writer = new FileWriter(path.join(tempDirectory, `/${ID}`), {
						channels: 1,
						sampleRate: 44100,
						bitDepth: 16
					});
					writer.write(Buffer.concat(chunks[id as keyof typeof chunks]));
					writer.end();
					writer.on("done", async () => {
						const data = await speechText(ID);
						await interaction.channel?.send(`**${user?.user.tag}:** ${data.text} (${data.confidence}%)`);
						setTimeout(() => fs.unlink(path.join(tempDirectory, `/${ID}`), () => null), 2.5 * 1000)
					});

					chunks[id as keyof typeof chunks] = [];
				})
		});
	} else if (subcommand === "stop") {
		const player = playing.get(interaction.guildId as string);
		if (!player) return await interaction.editReply(i18n.get("no_player", [{ name: "alert", value: config.emojis.alert }]));

		try {
			playing.delete(interaction.guildId as string);
			player.destroy();
			return await interaction.editReply(i18n.get("done", [{ name: "alert", value: config.emojis.alert }]));
		} catch (err) {
			await interaction.editReply(i18n.get("failed", [{ name: "alert", value: config.emojis.alert }, { name: "support", value: config.bot.support }]));
			throw new Error(`Transcript failed to stop. ${err}`);
		}
	}
}

export default new cmd(execute, {
	description: "Generate a transcript for the VC.",
	options: [{
		type: 1,
		name: "start",
		description: "Starts generating a transcript for your VC. Use /transcript stop to stop."
	}, {
		type: 1,
		name: "stop",
		description: "Stops generating a transcript for your VC."
	}]
});

import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from "@discordjs/voice";
import getAudioDurationInSeconds from "get-audio-duration";
import { unlink } from "fs";

import cmd from "../../Structures/command";
import config from "../../config.json";
import { CustomClient } from "../../Structures/types";
import { textSpeech } from "../../Modules/vtt";
import { voiceState, voiceStateTime } from "../../app";

async function execute(bot: CustomClient, interaction: CommandInteraction) {
	if (!interaction.guild?.members.me?.permissionsIn(interaction.channel?.id ?? "").has(["ViewChannel", "SendMessages"])) return interaction.editReply(`${config.emojis.alert} • I"m not able to send messages in this channel.`);
	if (voiceState.get(interaction?.guildId as string)) return interaction.editReply(`${config.emojis.alert} • Please wait until the sound by <@${voiceState.get(interaction?.guildId as string)}> finishes playing.`)
	if (!interaction.guild?.voiceAdapterCreator) return;

	const member = interaction.guild?.members.cache.get(interaction.user.id) ?? await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
	if (!member?.voice.channelId) return interaction.editReply(`${config.emojis.alert} • You're not connected to a Voice Channel.`);
	if (!interaction.guild?.members.me?.permissionsIn(member.voice.channelId).has(["ViewChannel", "Connect", "Speak"])) return interaction.editReply(`${config.emojis.alert} • I'm not able to Connect/Speak in your Voice Channel.`);

	const text: string = (interaction.options as CommandInteractionOptionResolver).getString("text") ?? "";
	const res = await textSpeech(text, (interaction.options as CommandInteractionOptionResolver).getString("speaker") ?? "en", interaction?.guildId as string);
	if (!res) return interaction.editReply(`${config.emojis.alert} • Something went wrong playing this file. Try playing less text.`);

	const connection = joinVoiceChannel({
		channelId: member?.voice?.channelId,
		guildId: interaction.guildId as string,
		adapterCreator: interaction.guild?.voiceAdapterCreator
	});

	voiceState.set(interaction.guildId as string, interaction.user.id);
	voiceStateTime.set(interaction.guildId as string, new Date().getTime());

	const player = createAudioPlayer();
	connection.subscribe(player);
	player.play(createAudioResource(res));

	const duration: number = await getAudioDurationInSeconds(res);
	await interaction.editReply(`${config.emojis.success} Now playing in <#${member?.voice.channelId}> for **${duration} seconds**.`);

	setTimeout(() => {
		unlink(res, () => null);
		voiceState.delete(interaction.guildId || '');
	}, (duration * 1000) + 1000);

	setTimeout(() => {
		if (((voiceStateTime.get(interaction.guildId as string) ?? 0) + ((duration * 1000) + (30) * 1000)) < new Date().getTime()) {
			connection.disconnect();
			voiceState.delete(interaction.guildId as string);
		}
	}, (duration * 1000) + (30) * 1000);
}

export default new cmd(execute, {
	description: "Play text in your VC.",
	options: [{
		type: 3,
		name: "text",
		description: "What you want the bot to say.",
		max_value: 300,
		required: true
	}, {
		type: 3,
		name: "speaker",
		description: "Who you want to speak",
		choices: [
			{ name: 'Albanian', value: 'sq' },
			{ name: 'Arabic', value: 'ar' },
			{ name: 'Chinese', value: 'zh' },
			{ name: 'Croatian', value: 'hr' },
			{ name: 'Czech', value: 'cs' },
			{ name: 'Danish', value: 'da' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'English (Australia)', value: 'en-au' },
			{ name: 'English (United Kingdom)', value: 'en-uk' },
			{ name: 'English (United States)', value: 'en-us' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Hindi', value: 'hi' },
			{ name: 'Hungarian', value: 'hu' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Japanese', value: 'ja' },
			{ name: 'Korean', value: 'ko' },
			{ name: 'Norwegian', value: 'no' },
			{ name: 'Polish', value: 'pl' },
			{ name: 'Portuguese', value: 'pt' },
			{ name: 'Russian', value: 'ru' },
			{ name: 'Spanish', value: 'es' },
			{ name: 'Swedish', value: 'sv' },
			{ name: 'Turkish', value: 'tr' }
		]
	}]
});

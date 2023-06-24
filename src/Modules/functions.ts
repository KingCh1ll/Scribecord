import { Guild, Channel, GuildTextBasedChannel, BaseMessageOptions, User, PermissionResolvable } from "discord.js";

import { CustomClient } from "../Structures/types";

/* -------------------------------------------------- SHARDING --------------------------------------------------*/
export async function getGuildById(cluster: any, id: string): Promise<Guild | null | undefined> {
	const data = await cluster.broadcastEval((c: any, id: string) => {
		const guild = c.guilds.cache.get(id);
		if (!guild) return null;

		return guild;
	}, { context: id });

	return Array.isArray(data) ? data.find((data) => data) : data;
}

export async function getChannelById(cluster: any, id: string): Promise<Channel | null | undefined> {
	const data: any = await cluster.broadcastEval((c: any, id: string) => c.channels.cache.get(id), { context: id });
	return Array.isArray(data) ? data.find((data) => data) : data
}

export async function getUserByIdAndAddRole(cluster: any, GuildId: string, UserId: string, RoleId: string, removeAfter?: number) {
	const data = await cluster.broadcastEval(async (c: any, context: { GuildId: string, UserId: string, RoleId: string, removeAfter?: number }) => {
		let guild = c?.guilds?.cache?.get(context.GuildId);
		if (!guild) return null;

		let role = guild?.roles?.cache?.get(context.RoleId);
		if (!guild || !role) return null;

		let member = await guild?.members?.fetch(context.UserId);
		if (!member?.roles?.cache?.has(context.RoleId)) member?.roles?.add(role);
		context.removeAfter && setTimeout(() => member?.roles?.cache?.has(context.RoleId) && member?.roles?.remove(role), context.removeAfter);
	
		return member
	}, { context: { GuildId, UserId, RoleId, removeAfter }});

	return Array.isArray(data) ? data.find((data) => data) : data
}

export async function getChannelByIdAndSend(cluster: any, id: string, data: BaseMessageOptions | any) {
	return await cluster.broadcastEval((c: any, context: { id: string, data: BaseMessageOptions | any }) => {
		const channel: GuildTextBasedChannel | null = c.channels.cache.get(context.id);
		if (!channel) return false;
		if (!channel?.guild?.members?.me) return false;
		if (channel?.permissionsFor(channel?.guild?.members?.me)?.has(["ViewChannel", "SendMessages"]) === false) return false;

		channel.send(context.data);
		return true;
	}, { context: { id, data } });
}

export async function getUserById(cluster: any, id: string) {
	const data = await cluster.broadcastEval(async (c: any, context: string) => {
		const user: User | null = c.users.cache.get(context) ?? await c.users.fetch(context).catch(() => null);
		if (!user) return false;

		return user;
	}, { context: id });
	
	return Array.isArray(data) ? data.find((data) => data) : data;
}

export async function checkMemberPermissions(cluster: any, guildId: string, userId: string, permission: PermissionResolvable) {
	const data = await cluster.broadcastEval(async (c: any, context: { guildId: string, userId: string, permission: string }) => {
		const guild = c.guilds.cache.get(context.guildId);
		if (!guild) return false;
		
		const member = await guild.members.fetch(context.userId).catch(() => null);
		if (!member) return false;

		const { PermissionsBitField } = require("discord.js");
		return member?.permissions?.has(PermissionsBitField.Flags[context.permission as keyof typeof PermissionsBitField.Flags]);
	}, { context: { guildId, userId, permission } });
	
	return Array.isArray(data) ? data.find((data) => data) : data;
}

export async function getChannelsByGuildId(cluster: any, id: string) {
	const data = await cluster.broadcastEval(async (c: any, content: string) => {
		const guild = c.guilds.cache.get(content);
		if (!guild) return null;

		return guild.channels.cache;
	}, { context: id });
	
	return Array.isArray(data) ? data.find((data) => data) : data;
}

export async function getRolesByGuildId(cluster: any, id: string) {
	const data = await cluster.broadcastEval(async (c: any, content: string) => {
		const guild = c.guilds.cache.get(content);
		if (!guild) return null;

		return guild.roles.cache;
	}, { context: id });
	
	return Array.isArray(data) ? data.find((data) => data) : data;
}

/* -------------------------------------------------- OTHER --------------------------------------------------*/
/**
 * Split bar. A nice little progress bar.
 * @param {number} current The current progress.
 * @param {number} total The total progress.
 * @param {number} size The size of the progress bar.
 * @param {string} line The line of the progress bar. Default: ▬
 * @param {string} slider The slider emoji. Default: 🔘
 * @returns {string} The progress bar, as a string.
 */
export function splitBar(current: number, total: number, size = 40, line = "▬", slider = "🔘") {
	if (current > total) {
		return line.repeat(size + 2);
	} else {
		const percent = current / total;
		const progress = Math.round(size * percent);
		const progLeft = size - progress;

		return line.repeat(progress).replace(/.$/, slider) + line.repeat(progLeft);
	}
};

export function cleanContent(content: string, channel: any) {
	return content.replace(/<@!?[0-9]+>/g, input => {
		const id = input.replace(/<|!|>|@/g, "");
		if (channel.type === 1) {
			const user = channel.client.users.cache.get(id);
			return user ? `@${user.username}`.replaceAll("@", "@\u200b") : input;
		}

		const member = channel.guild.members.cache.get(id);
		if (member) {
			return `@${member.displayName}`.replaceAll("@", "@\u200b");
		} else {
			const user = channel.client.users.cache.get(id);
			return user ? `@${user.username}`.replaceAll("@", "@\u200b") : input;
		}
	}).replace(/<#[0-9]+>/g, input => {
		const mentionedChannel = channel.client.channels.cache.get(input.replace(/<|#|>/g, ""));
		return mentionedChannel ? `#${mentionedChannel.name}` : input;
	}).replace(/<@&[0-9]+>/g, input => {
		if (channel.type === 1) return input;
		const role = channel.guild.roles.cache.get(input.replace(/<|@|>|&/g, ""));
		return role ? `@${role.name}` : input;
	});
};

/**
*
* @param {number} Number The number to format.
* @returns {string} The formatted number.
*/
export function formatNumber(Number: any) {
	if (typeof Number === "string") Number = parseInt(Number);

	const DecPlaces = Math.pow(10, 1);
	const Abbrev = ["k", "m", "g", "t", "p", "e"];

	for (let i = Abbrev.length - 1; i >= 0; i--) {
		const Size = Math.pow(10, (i + 1) * 3);

		if (Size <= Number) {
			Number = Math.round((Number * DecPlaces) / Size) / DecPlaces;

			if (Number === 1000 && i < Abbrev.length - 1) {
				Number = 1;
				i++;
			}

			Number += Abbrev[i];
			break;
		}
	}

	return Number;
};

/**
*
* @param {number} ms The ms to convert to a time.
* @param {string} type The type of formatted time. (long/short)
* @returns {string} The time.
*/
export function convertTime(ms: number, type: "long" | "short" = "long") {
	const RoundNumber = ms > 0 ? Math.floor : Math.ceil;
	const Months = RoundNumber(ms / 2629800000);
	const Days = RoundNumber(ms / 86400000) % 30.4167;
	const Hours = RoundNumber(ms / 3600000) % 24;
	const Mins = RoundNumber(ms / 60000) % 60;
	const Secs = RoundNumber(ms / 1000) % 60;

	let time;
	if (type === "long") {
		time = Months > 0 ? `${Months} Month${Months === 1 ? "" : "s"}, ` : "";
		time += Days > 0 ? `${Days} Day${Days === 1 ? "" : "s"}, ` : "";
		time += Hours > 0 ? `${Hours} Hour${Hours === 1 ? "" : "s"}, ` : "";
		time += Mins > 0 ? `${Mins} Minute${Mins === 1 ? "" : "s"} & ` : "";
		time += Secs > 0 ? `${Secs} Second${Secs === 1 ? "" : "s"}` : "0 Seconds";
	} else if (type === "short") {
		time = Months > 0 ? `${Months}m ` : "";
		time += Days > 0 ? `${Days}d ` : "";
		time += Hours > 0 ? `${Hours}h ` : "";
		time += Mins > 0 ? `${Mins}m ` : "";
		time += Secs > 0 ? `${Secs}s` : "0s";
	}

	return time;
};

/**
*
* @param {object} addedTime The seconds, minutes, and hours to add to the date object.
* @param {Date} date The date to add time to.
* @returns {string} The date object with the added seconds, minutes, and hours.
*/
export function addTime(addedTime: { seconds: number, minutes: number, hours: number }, date: Date) {
	let ms = date.getTime();
	if (addedTime.seconds) ms += 1000 * addedTime.seconds; //check for additional seconds 
	if (addedTime.minutes) ms += 1000 * 60 * addedTime.minutes;//check for additional minutes 
	if (addedTime.hours) ms += 1000 * 60 * 60 * addedTime.hours;//check for additional hours 
	return new Date(ms);
};

/**
* Get's all of the bot's guilds and counts them up.
* @returns {string} Server count
*/
export async function serverCount(cluster: any) {
	const results = await cluster.broadcastEval((c: CustomClient) => c.guilds.cache.size);
	return results.reduce((prev: any, val: any) => prev + val, 0);
};

/**
* Returns the current user count.
* @returns {string} User count
*/
export async function userCount(cluster: any) {
	const results = await cluster.broadcastEval((c: CustomClient) => c.guilds.cache.map(server => server.memberCount));
	return results.flat().reduce((prev: any, val: any) => prev + val, 0);
};

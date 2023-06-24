// S C R I B E ✨ C O R D //
// KingCh1ll / Ch1llDev //

/* -------------------------------------------------- LIBRARIES --------------------------------------------------*/
import { Client, Options, Collection, GatewayIntentBits, ApplicationCommand, WebhookClient, Colors } from "discord.js";
import { ClusterClient, getInfo } from "discord-hybrid-sharding";
import Statcord from "@zerotwobot/statcord.js";
import fs from "fs";
import path from "path";
import Util from "util";

import { CustomClient, Category, Command, Slash } from "./Structures/types";
import config from "./config.json";
import logger from "./Modules/logger";

/* -------------------------------------------------- Client --------------------------------------------------*/
export const app: CustomClient = new Client({
	presence: {
		status: "idle",
  		activities: [{ name: "Connecting...", type: 3 }]
	},
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		ReactionManager: 0,
		ReactionUserManager: 0,
		GuildEmojiManager: 0,
        GuildForumThreadManager: 0,
		GuildStickerManager: 0,
        GuildScheduledEventManager: 0,
        GuildTextThreadManager: 0,
		GuildInviteManager: 0,
		GuildBanManager: 0,
		AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        MessageManager: 0,
        PresenceManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        UserManager: 0,
	}),
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates
	],
	shards: getInfo()?.SHARD_LIST ?? undefined,
	shardCount: getInfo()?.TOTAL_SHARDS ?? undefined
});

/* -------------------------------------------------- Config --------------------------------------------------*/
export const cluster = new ClusterClient(app);
export const statClient = Statcord.ClusterClient;
export const wait = Util.promisify(setTimeout);
export const categories = new Collection<string, Category>();
export const commands = new Collection<string, Command>();
export const voiceState = new Collection<string, string>();
export const voiceStateTime = new Collection<string, number>();
app.cluster = cluster;

/* -------------------------------------------------- Start --------------------------------------------------*/
new Promise(async resolve => {
	for (const file of fs.readdirSync(path.resolve(__dirname, `./Events`)).filter(file => file.endsWith(".js"))) {
		const event = (await import(path.resolve(__dirname, `./Events/${file}`))).default;
		const handleArgs = (...args: string[]) => event.execute(app, ...args);
		event.once ? app.once(file.split(".")[0], handleArgs) : app.on(file.split(".")[0], handleArgs);
	}

	let slashCommands: Slash[] = [];
	fs.readdirSync(path.resolve(__dirname, "./Commands")).map((cat: string) => {
		const category = require(`./Commands/${cat}/index.js`)?.default;
		categories.set(cat, category);

		fs.readdirSync(path.resolve(__dirname, `./Commands/${cat}/`)).filter(f => f.endsWith(".js") && !(f.startsWith("index"))).map(cmd => {
			let command: Command = require(`./Commands/${cat}/${cmd}`).default;
			let commandName: string = cmd.split(".")[0];
			if (!command) return;

			command.category = category.name;
			command.settings.name = commandName;
			command.description = category.description;

			if (!categories.has(command.category)) categories.set(command.category, category);
			if (commands.has(commandName)) return logger(`You cannot set command ${commandName} because it is already in use by the command ${(commands?.get(commandName))?.settings.name}. This is most likely due to a accidental clone of a command with the same name.`, "error");
			commands.set(commandName, command);

			if (command.settings.description.length >= 100) command.settings.description = `${command.settings.description.slice(0, 96)}...`;
			slashCommands.push({
				name: commandName,
				description: command.settings.description,
				options: command.settings.options || [],
				type: 1
			});
		});
	});

	resolve(true);

	const ready = app.readyAt ? Promise.resolve() : new Promise(r => app.once("ready", r));
	await ready;

	const currentCmds = await app.application?.commands?.fetch()?.catch(() => null);
	if (!currentCmds) return console.error("Current commands failed to fetch. Please make sure your wifi is working.");

	const newCmds = slashCommands.filter(cmd => !currentCmds.some(c => c.name === cmd.name));
	for (const newCmd of newCmds) await app.application?.commands?.create(newCmd); // 763803059876397056 for guild only commands

	const removedCmds = currentCmds.filter(cmd => !slashCommands.some(c => c.name === cmd.name)).toJSON();
	for (const removedCmd of removedCmds) await removedCmd.delete();

	const updatedCmds = slashCommands.filter(cmd => slashCommands.some(c => c.name === cmd.name));
	for (const updatedCmd of updatedCmds) {
		const newCmd = updatedCmd;
		const previousCmd = currentCmds.find(c => c.name === newCmd.name);
		let modified = false;

		if (previousCmd && previousCmd.description !== newCmd.description) modified = true;
		if (!ApplicationCommand.optionsEqual(previousCmd?.options || [], newCmd?.options || [])) modified = true;
		if (previousCmd && modified) await previousCmd.edit(updatedCmd);
	}
}).then(async () => await app.login(process.argv.includes("--dev") === true ? config.devToken : config.token));

/* -------------------------------------------------- Handle Errors --------------------------------------------------*/
const webhookClient: WebhookClient = new WebhookClient(config.logger.error);
async function handleError(err: Error) {
	logger("Error", `Unhandled exception error. ${err?.stack ?? err}.`, "red");

	const paths = err?.stack?.match(/\(([^()]*)\)/g);
	process.argv.includes("--dev") === false && await webhookClient.send({
		embeds: [{
			description: `**Error**\n> ${config.emojis.folder} **Path**: \`${(paths?.at(-1))?.slice(1, -1) ?? "Unknown"}\``,
			fields: [{
				name: "Stack",
				value: `\`\`\`js\n${(err?.message ?? err).slice(0, 950)}\`\`\``
			}],
			color: Colors.Red
		}]
	});
};

process.on("uncaughtException", handleError);
process.on("unhandledRejection", handleError);

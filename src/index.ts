// S C R I B E ✨ C O R D //
// KingCh1ll / Ch1llDev //

/* -------------------------------------------------- LIBRARIES --------------------------------------------------*/
import { WebhookClient, Colors } from "discord.js";
import { Cluster, ClusterManager, HeartbeatManager } from "discord-hybrid-sharding";
import Statcord from "@zerotwobot/statcord.js";
import express, { Response } from "express";

import { CustomRequest } from "./Structures/types";
import { serverCount } from "./Modules/functions";
import logger from "./Modules/logger";
import config from "./config.json";

let manager: ClusterManager;
new Promise(resolve => {
	let num: number = 0;
	const loader: NodeJS.Timer = setInterval(() => { process.stdout.write(`\r${["\\", "|", "/", "-"][num++]} [App] Loading...`); num %= 4; }, 100);
	setTimeout(() => { clearInterval(loader); process.stdout.write(`\r- [App] Loading...`); resolve(console.clear()) }, 1500);
}).then(async () => {
	process.argv.includes("--dev") && logger("Dev", "Developer mode enabled. Some features may not work right on this mode.", "green");

	manager = new ClusterManager(`${__dirname}/app.js`, {
		totalShards: process.argv.includes("--dev") ? 1 : config.manager.totalShards,
		shardsPerClusters: 1,
		totalClusters: process.argv.includes("--dev") ? 1 : config.manager.totalClusters,
		shardArgs: [...process.argv],
		token: config.token
	}); manager.extend(new HeartbeatManager({ interval: 2000, maxMissedHeartbeats: 5 }))

	process.argv.includes("--dev") !== true && new Statcord.ClusterClient({
		manager,
		key: config.apis.statcord,
		postCpuStatistics: true,
		postMemStatistics: true,
		postNetworkStatistics: true,
		autopost: true
	});

	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use((req: CustomRequest, res: Response, next: Function) => {
		req.manager = manager;

		next();
	});

	app.get("/", require("./Api/index.js"));
	app.get("/stats", require("./Api/stats.js"));
	app.post("/vote", require("./Api/vote.js"));

	app.use((req: CustomRequest, res: Response) => res.status(404).send({ status: 404, message: "API endpoint not found." }));
	app.use((err: string, req: CustomRequest, response: Response) => {
		console.error("[API]", err);
		response.status(500).send({ status: 500, message: err });
	});
	app.listen(config.manager.port ?? 3000, () => logger("API", `DisScribe API online and listening to port ${config.manager.port}.`, "green"));

	let clustersReady = 0;
	manager.on("clusterCreate", (cluster: Cluster) => {
		logger(`Cluster ${cluster.id + 1}/${manager.totalShards}`, `Deployed`);

		cluster.on("ready", () => {
			clustersReady++;
			if (clustersReady === config.manager.totalShards) setTimeout(() => logger("Ready", "All clusters are ready.", 'green'), 1200);
		});
		cluster.on("disconnect", () => logger(`Cluster ${cluster.id + 1}/${manager.totalShards}`, `Lost Connection!`, "red"));
		cluster.on("reconnecting", () => logger(`Cluster ${cluster.id + 1}/${manager.totalShards}`, `Reconnecting.`));
		cluster.on("error", () => logger(`Cluster ${cluster.id + 1}/${manager.totalShards}`, `An error occurred!`, "red"));
		cluster.on("death", () => logger(`Cluster ${cluster.id + 1}/${manager.totalShards}`, `Offline.`));
	});

	if (process.argv.includes("--dev") === false) {
		const botlists: { name: string, request: Function }[] = [{
			name: "topgg",
			request: async function (token: string): Promise<unknown> {
				const response = await fetch(`https://top.gg/api/bots/${config.bot.id}/stats`, {
					method: "POST",
					headers: {
						'Authorization': token,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ server_count: `${await serverCount(manager)}`, shard_count: `${manager.totalShards}` })
				});

				let responseBody = await response.text();
				if (!response.ok) throw new Error(`[Botlist]: Failed to send data for "${this.name}". ${response.status} ${response.statusText}`);
				return responseBody;
			}
		}, {
			name: "dlist",
			request: async function (token: string): Promise<unknown> {
				const response = await fetch(`https://api.discordlist.gg/v0/bots/${config.bot.id}/stats`, {
					method: "POST",
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ server_count: await serverCount(manager) })
				});

				let responseBody = await response.json();
				if (!response.ok) throw new Error(`[Botlist]: Failed to send data for "${this.name}". ${response.status} ${response.statusText}\n${responseBody}`);
				return responseBody;
			}
		}];

		setInterval(async () => Object.keys(config.botlists).forEach(async list => {
			const data = botlists.find((b) => b.name === list);
			if (!data) throw new Error(`[Botlist] Botlist "${list}" was not found in avalible botlists.`);

			const token = Object.entries(config.botlists).find((b) => b[0] === list);
			if (!token || !token[1]) throw new Error(`[Botlist] Failed to get token for "${list}". Please make sure you provided a valid botlist token.`);

			await data.request(token[1]);
		}), 300 * 1000);
	}

	await manager.spawn({ timeout: -1, delay: 7000 });
});

const webhookClient: WebhookClient = new WebhookClient(config.logger.error);
async function handleError(err: Error) {
	logger("Error", `Unhandled exception error. ${err?.stack ?? err}.`, "red");

	const paths = err?.stack?.match(/\(([^()]*)\)/g);
	process.argv.includes("--dev") === false && await webhookClient.send({
		embeds: [{
			description: `**Cluster Error**\n> ${config.emojis.folder} **Path**: \`${(paths?.at(-1))?.slice(1, -1) ?? "Unknown"}\``,
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

export { manager };
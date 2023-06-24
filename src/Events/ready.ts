import { Client } from "discord.js";

import { statClient } from "../app";
import logger from "../Modules/logger";
import { CustomClient } from "../Structures/types";

export default {
	once: false,
	async execute(client: CustomClient) {
		client?.cluster && client.cluster?.send({ data: client.guilds.cache.size, sendType: "serverCount" });
		client.user?.setPresence({
			status: "online",
			activities: [{
				name: `Cluster: ${client.cluster?.id} • ch1ll.dev`,
				type: 3 as any
			}]
		});

		statClient ? statClient.post(client) : logger("Warning", "Statcord is not installed! Statitics will not be posted.", "yellow");
	}
};

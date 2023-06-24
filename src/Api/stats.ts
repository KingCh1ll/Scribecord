import { Request, Response } from "express";
import { manager } from "../index";
import { Guild } from "discord.js";
import { CustomClient } from "../Structures/types";

let shardData: any;
setInterval(() => shardData = null, 15 * 1000);

module.exports = async (req: CustomClient, res: Response) => {
    if (!shardData) shardData = await manager.broadcastEval((c: CustomClient) => {
        const shardIds = c.cluster?.ids?.keys();
        let status = [...shardIds].map(id => {
            const shard = c.ws.shards.get(id);
            return shard?.status !== 0 ? shard?.status : null;
        })?.[0];

        return {
            clusterId: c.cluster?.id,
            shardIds: [...shardIds],
            status: status === null ? 0 : status,
            totalGuilds: c.guilds.cache.size,
            totalMembers: c.guilds.cache.map((g: Guild) => g.memberCount).reduce((a: number, b: number) => a + b, 0),
            ping: c.ws.ping,
            uptime: c.uptime,
            memoryUsage: Object.fromEntries(Object.entries(process.memoryUsage()).map(d => {
                d[1] = Math.floor(d[1] / 1024 / 1024 * 100) / 100;
                return d;
            })),
            perShardData: [...shardIds].map(shardId => ({
                shardId,
                status: c.ws.shards.get(shardId)?.status,
                ping: c.ws.shards.get(shardId)?.ping,
                uptime: Date.now() - ((c.ws.shards.get(shardId) as any)?.connectedAt || 0),
                guilds: c.guilds.cache.filter((x: { shardId: number }) => x.shardId === shardId).size,
                members: c.guilds.cache.filter((x: { shardId: number }) => x.shardId === shardId).map((g: Guild) => g.memberCount).reduce((a: number, b: number) => a + b, 0),
            }))
        }
    });

    res.status(200).send(shardData);
};

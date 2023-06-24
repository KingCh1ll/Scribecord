import { Request, Response } from "express";
import { Colors } from "discord.js";

import { getChannelByIdAndSend, getUserById, getUserByIdAndAddRole } from "../Modules/functions";
import { manager } from "../index";
import config from "../config.json";

const voteUrls = {
    botlabs: {
        url: "bots.discordlabs.org",
        voteUrl: `https://bots.discordlabs.org/bot/${config.bot.id}/vote`,
        color: "#e1e85a"
    },
    topgg: {
        url: "top.gg",
        voteUrl: `https://top.gg/bot/${config.bot.id}/vote`,
        color: "BLUE"
    }
};

module.exports = async (req: Request, res: Response) => {
    console.log(`New vote from ${req.body?.uid} on ${req.body?.listName} (${req.body?.list}).`);

    try {
        const vote = req.body;
        const userId = vote.uid || vote.user || vote.userID;
        if (!userId) return res.status(400).send({ status: 400, message: "User ID not provided." });

        const listData = voteUrls[vote.list as keyof typeof voteUrls] || {};
        const user = await getUserById(manager, userId)
        await getChannelByIdAndSend(manager, config.logger.vote, {
            embeds: [{
                description: `**🎉 ${user?.id ? `<@${user?.id}>` : `\`${user?.tag}\``} Voted for DisScribe!**\nYou can vote again <t:${~~((Date.now() / 1000) + 43200)}:R>.`,
                color: user?.hexAccentColor ? parseInt(user?.hexAccentColor?.slice(1), 16) : Colors.Blurple,
                thumbnail: { url: user?.displayAvatarURL ?? "https://cdn.discordapp.com/embed/avatars/1.png" }
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Vote",
                    emoji: "<:stats:947990408657518652>",
                    style: 5,
                    url: listData.voteUrl
                }]
            }]
        });

        await getUserByIdAndAddRole(manager, "763803059876397056", userId, "974046093140693133", 720000);
        res.status(200).send({ status: 200, message: "Success!" });
    } catch (err) {
        res.status(500).send({ status: 500, message: `Internal Server Error. ${err}` });
        throw new Error(`Internal Server Error. ${err}`);
    }
};

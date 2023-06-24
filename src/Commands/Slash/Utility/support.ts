import { Colors, Client, CommandInteraction } from "discord.js";

import cmd from "../../../Structures/command";
import config from "../../../config.json";
import { GuildTypes } from "../../../Models/guild";
import { CustomClient } from "../../../Structures/types";
import LanguageHandler from "../../../Languages/Handler";

export default new cmd(async (bot: CustomClient, interaction: CommandInteraction, data: { guild: GuildTypes }) => {
    const i18n = new LanguageHandler({ language: data.guild.language ?? "en-US", command: "support" });
    return interaction.editReply({
        embeds: [{
            description: i18n.get("reply", [{
                name: "question",
                value: config.emojis.question
            }, {
                name: "support",
                value: config.bot.support
            }]),
            color: Colors.Blurple
        }]
    })
}, {
    description: "Need help with me? No worries, join the Discord server!",
    perms: [],
    bot_perms: ["ViewChannel"],
    guildOnly: true,
    options: []
});

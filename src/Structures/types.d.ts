import { ApplicationCommand, PermissionResolvable, ApplicationCommandOption, ApplicationCommandOptionType, Client, DjsDiscordClient, BaseSelectMenuComponent, ComponentType, ModalComponentData, ModalData, TextInputStyle, CommandInteraction, Interaction } from "discord.js";
import { ClusterManager, ClusterClient, BaseMessage, Serialized } from "discord-hybrid-sharding";
import { Request } from "express";
import { GuildTypes } from "../Models/guild";

/* -------------------------------------------------- CLIENT --------------------------------------------------*/
export interface CustomClient extends Client {
    cluster?: ClusterClient<DjsDiscordClient>;
}

export interface Category {
    name: string,
    description: string,
    emoji: string,
    emojiID: string,
    commands: CommandOptions[]
}

export interface Command {
    category: string,
    description: string,
    settings: CommandOptions;
    run: (client: CustomClient, interaction: CommandInteraction) => unknown;
}

export type Slash = APIApplicationCommand & {
    name: string,
    description: string,
    options: CommandOptions["options"];
    type: number;
}

export interface CommandOptions {
    name?: string,
    description: string,
    cooldown?: number,
    enabled?: boolean,
    perms?: PermissionResolvable[],
    bot_perms?: PermissionResolvable[],
    guildOnly?: boolean,
    voteOnly?: boolean,
    ephemeral?: boolean,
    options?: {
        name?: string;
        description?: string;
        required?: boolean;
        type?: ApplicationCommandOptionType;
        min_value?: number;
        max_value?: number;
        choices?: {
            name?: string;
            value?: string;
        }[];
        options?: {
            name?: string;
            description?: string;
            required?: boolean;
            type?: ApplicationCommandOptionType;
            min_value?: number;
            max_value?: number;
            choices?: {
                name?: string;
                value?: string;
            }[];
        }[];
    }[];
};

/* -------------------------------------------------- EXPRESS --------------------------------------------------*/
export interface CustomRequest extends Request {
    manager?: ClusterManager;
}

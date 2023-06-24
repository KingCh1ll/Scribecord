import { WebhookClient } from "discord.js";
import config from "../config.json";

export const colors: Record<string, string> = { // Source: chalk internal
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	grey: '\x1b[37m\x1b[2m',

	blackBright: '\x1b[30m\x1b[1m',
	redBright: '\x1b[31m\x1b[1m',
	greenBright: '\x1b[32m\x1b[1m',
	yellowBright: '\x1b[33m\x1b[1m',
	blueBright: '\x1b[34m\x1b[1m',
	magentaBright: '\x1b[35m\x1b[1m',
	cyanBright: '\x1b[36m\x1b[1m',
	whiteBright: '\x1b[37m\x1b[1m',
	greyBright: '\x1b[37m\x1b[2m\x1b[1m',

	// BGblackBright: '\x1b[40m\x1b[1m',
	// BGredBright: '\x1b[41m\x1b[1m',
	// BGgreenBright: '\x1b[42m\x1b[1m',
	// BGyellowBright: '\x1b[43m\x1b[1m',
	// BGblueBright: '\x1b[44m\x1b[1m',
	// BGmagentaBright: '\x1b[45m\x1b[1m',
	// BGcyanBright: '\x1b[46m\x1b[1m',
	// BGwhiteBright: '\x1b[47m\x1b[1m',
	// BGgreyBright: '\x1b[47m\x1b[2m\x1b[1m',

	reset: '\x1b[0m',
};

const webhookClient: WebhookClient = new WebhookClient(config.logger.logs);
export function combine(text: string, color: string) { return colors[color as keyof typeof colors] + text + colors.reset; }
export default function (type: string, content: string, color?: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'grey'): null {
	if (!content || !type) return null;

	console.log(`[${combine(type, color ?? "grey")}] ${combine(content, color ?? "white")}`);
	process.argv.includes("--dev") !== true && content !== "" && webhookClient.send(`**[${type}]** ${content}`);

	return null;
};

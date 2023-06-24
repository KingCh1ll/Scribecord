export default {
	name: "Utility",
	description: "Get help, or view a user's information. Simple. That's DisScribe.",
	emoji: "<:tool:948028430979567646>",
	emojiID: "948028430979567646",
	commands: require("fs").readdirSync(__dirname).filter((c: string) => c !== "index.js" && c.endsWith(".js")).map((c: string) => require(`${__dirname}/${c}`))
};

module.exports = {
  main: {
    name: "Menu",
    shortDesc: "Return to the main menu.",
    desc: `{info} | **About DisScribe**\n> I'm a fun bot that can convert text to speech, speech to text, and record audio!\n\n**{slash} | Commands**\n> ${["</help:1027412710423531531>", "</info:1027412711274971147>", "</play:1098406924153794630>", "</record:1098407004550209577>", "</transcript:1098407006064353371>"].join(", ")}\n\n**{award} | Credits**\n${[{
      name: "Ch1llDev / KingCh1ll",
      desc: "Founder / Developer",
      link: "https://ch1ll.dev/"
    }, {
      name: "Icons",
      desc: "Black & White Icons",
      link: "https://discord.gg/mm5QWaCWF5"
    }].map(c => `> [${c.name}](${c.link}) • ${c.desc}`).join("\n")}\n\n**{question} | Join Our Community!**\n> Feel free to join our [Discord server]({support}) for support, or to talk to the community.`,
    placeholder: "Select a page to view more information."
  },
  stats: {
    name: "Stats",
    desc: "View DisScribe's statistics.",
    server: {
      name: "**Server**",
      value: `{rocket} CPU: **{cpu}%**\n{stats} Memory: **{memory}%**\n{clock} Uptime: **{uptime}**`
    },
    app: {
      name: "**Bot Statistics**",
      value: `{globe} Servers: **{servers}**\n{player} Users: **{users}**`
    }
  },
  perms: {
    name: "Permissions",
    desc: `**Permissions**\n> *Below are a list of permissions DisScribe needs in order to work correctly in this server.*\n\n{perms}`,
    shortDesc: "View DisScribe's permissions for the server."
  },
  feedback: {
    name: "Feedback",
    message: "Message"
  },
  buttons: {
    invite: "Invite",
    website: "Website",
    feedback: "Feedback"
  }
};
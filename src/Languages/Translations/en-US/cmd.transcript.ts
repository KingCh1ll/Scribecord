module.exports = {
    current: "{alert} • Please stop the current transcript generating",
    voice: "${alert} • You're not connected to a Voice Channel.",
    no_player: "{alert} • A transcript is currently not generating in this guild.",
    done: "{alert} • Successfully stopped the transcript from generating. Thanks for using DisScribe!",
    transcript: {
        started: "{alert} • Transcript started. Transcript may take up to 10 seconds. This command is in beta, which means that any/all functionality is subject to change. Run </transcript stop:1> to stop the transcript from generating.\n\n**DISCLAIMER**: While using this command, you agree that all users in your voice chat agree to be recorded. All recordings are deleted after 10 seconds of the transcript being completed.",
        failed: "{alert} • Transcript failed to stop. Please report this in our [support]({support}) server."
    },
    perms: {
        voice: "{alert} • I'm not able to Connect/Speak in your Voice Channel.",
        channel: "{alert} • I'm not able to send messages in this channel."
    }
}
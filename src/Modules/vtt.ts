import fs from "fs";
import path from "path";
import { Transform, Readable } from "stream";
import wav from "wav";
import { wait } from "../app";
import { OpusEncoder } from "@discordjs/opus";

/* -------------------------------------------------- MAIN (https://alphacephei.com/vosk/models) --------------------------------------------------*/
const vosk = require("vosk");
const model = new vosk.Model(path.join(__dirname, "../", "../", "/Models/model_aspire"));

export class OpusDecodingStream extends Transform {
	encoder: OpusEncoder;

	constructor() {
		super();
		this.encoder = new OpusEncoder(48000, 1);
	}

	_transform(data: Buffer, encoding: unknown, callback: () => void) {
		this.push(this.encoder.decode(data));
		callback();
	}
}

export interface VoskOut {
	confidence: number;
	result: {
		start: number;
		end: number;
		word: string;
	}[];
	text: string;
  }

export async function textSpeech(text: string, lang: string, guildId: string): Promise<string> {
	const gtts = require("gtts");
	const tts = new gtts(text?.replaceAll(/<\/?[^>]+(>|$)/g, ""), lang ?? "en");
	let filePath = path.join(__dirname, "../", "../", "/Temp", "/TTS", `/${guildId}.mp3`);

	return new Promise(async (res, rej) => await tts.save(filePath, async (err: string) => { if (err) { rej(err); throw new Error(err); }; res(filePath); }));
};

export async function speechText(id: string): Promise<VoskOut> {
	const wfReader = new wav.Reader();
	const wfReadable = new Readable().wrap(wfReader);

	const transcription: Promise<VoskOut> = new Promise(resolve => wfReader.on("format", async ({ audioFormat, sampleRate, channels }) => {
		if (audioFormat != 1 || channels != 1) {
			console.error("Audio file must be WAV format mono PCM.");
			return null;
		};

		const rec = new vosk.Recognizer({ model, sampleRate });
		rec.setMaxAlternatives(1);
		rec.setWords(true);

		let results: any[] = [];
		for await (const data of wfReadable) {
			const end_of_speech = rec.acceptWaveform(data);
			if (end_of_speech) results.push(rec.result());
			// console.log(JSON.stringify(rec.result(), null, 4));
		}

		results.push(rec.finalResult(rec));
		rec.free();

		let out: VoskOut = { confidence: results[0].confidence, result: [], text: "" };
		for (let r of results) {
			out.text != r.alternatives[0].text;
			out.result = [...out.result, ...r.alternatives[0].result]
		}

		resolve(out);
	}));

	fs.createReadStream(path.join(__dirname, "../", "../", "/Temp/VTT", `/${id}`), { highWaterMark: 4096 }).pipe(wfReader);
	return transcription;
}
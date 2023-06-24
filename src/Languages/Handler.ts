import fs from "fs";
import path from "path";

export type defaultType = { language: string, command: "config" | "help" | "info" | "language" | "support" | "donate" | "record" | "transcript" };

export default class LanguageHandler {
    private data: any;
    public default: defaultType;

    constructor(options: defaultType) {
        const file: string = fs
            .readdirSync(path.resolve(__dirname, `./Translations/${options?.language}/`))
            .filter(f => f.endsWith(".js") && !(f.startsWith("index")))
            .filter(f => f.includes(options?.command ?? this?.default?.command))
            .join(" ");

        if (file) this.data = require(`./Translations/${options?.language}/${file?.split(" ")?.at(0)}`);
        else throw new Error(`[i18n]: Failed to find translation files for "${options?.language}".`);

        this.default = options;
    }

    public get(path: string, placeholders?: { name: string, value: string | undefined }[]) {
        const pathArray = path.split(".");
        if (!pathArray) return this.data[path];

        let string = this.data;
        try {
            pathArray.forEach((_, i: number) => string = string?.[pathArray?.[i]]);

            if (placeholders && placeholders?.length > 0) placeholders?.forEach(p => string = string?.replaceAll(`{${p?.name}}`, p?.value));
        } catch (err) { throw new Error(`[Language Handler] ${(err as any)?.message ?? err}`); }

        return string ?? path;
    }
}
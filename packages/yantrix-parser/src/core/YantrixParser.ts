import { YantrixLangiumParser } from '.';

export class YantrixParser {
	private langiumParser: YantrixLangiumParser;

	constructor() {
		this.langiumParser = new YantrixLangiumParser();
	}

	async parse(text: string) {
		return await this.langiumParser.parse(text);
	}
}

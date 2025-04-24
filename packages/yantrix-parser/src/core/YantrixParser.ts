import { YantrixLangiumParser } from '.';

export class YantrixParser {
	private langiumParser: YantrixLangiumParser;

	constructor() {
		this.langiumParser = new YantrixLangiumParser();
	}

	parse(text: string) {
		return this.langiumParser.parse(text);
	}
}

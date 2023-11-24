import * as fs from "fs";
//@ts-ignore
import * as jison from "jison";


function parseNotes(input: string) {
    const bnf = fs.readFileSync("grammar/parserGrammar.jison", "utf8");
    const parser = new jison.Jison.Parser(bnf);
    const result = parser.parse(input);
    return result;
}

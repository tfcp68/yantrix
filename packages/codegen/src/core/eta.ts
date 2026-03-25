import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Eta } from 'eta';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const eta = new Eta({
	views: path.resolve(__dirname, 'templates'),
	cache: true,

});

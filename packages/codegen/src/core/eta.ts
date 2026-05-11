import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Eta } from 'eta';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const etaViewsPath = path.resolve(__dirname, 'templates');

export const eta = new Eta({
	views: etaViewsPath,
	cache: true,
});

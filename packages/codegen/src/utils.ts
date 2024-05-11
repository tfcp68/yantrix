import { readFile } from 'fs/promises';
import { join } from 'path';
import { format } from 'prettier';
import { cwd } from 'process';

const prettierCfgPath = join(cwd(), '.prettierrc');
export const fmt = async (code: string) => {
  try {
    const prettierCfgRaw = await readFile(prettierCfgPath, 'utf-8');
    const prettierCfg = JSON.parse(prettierCfgRaw);
    return format(code, { ...prettierCfg, parser: 'babel-ts' });
  } catch {
    return code;
  }
};

import { format } from 'node:util';
import { stdout } from 'process';

const log = (...data: unknown[]) => stdout.write(format(...data) + '\n');

log('Hello from @yantrix/cli!');

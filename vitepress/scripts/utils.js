import fs from 'node:fs';

function copyDirectorySync(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	fs.cpSync(src, dest, { recursive: true });
}

export { copyDirectorySync };

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { DefaultTheme } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const menuOrder = ['', 'architecture', 'syntax', 'integrations', 'contributing', 'api' + ' reference'];

// https://vitepress.dev/reference/site-config
export default withMermaid({
	description: 'Yantrix - Low-Code Finite State Machines',
	srcDir: './src',
	ignoreDeadLinks: true,
	base: '/yantrix',
	assetsDir: './public',
	title: 'Yantrix',
	appearance: 'force-dark',
	lastUpdated: true,
	search: {
		provider: 'local',
	},
	head: [
		['meta', { name: 'theme-color', content: '#000000' }],
		['meta', { property: 'og:image', content: '/yantrix/logo.png' }],
		['meta', { property: 'og:image:width', content: '512' }],
		['meta', { property: 'og:image:height', content: '512' }],
		['meta', { property: 'og:title', content: 'Yantrix Documentation' }],
		[
			'meta',
			{
				property: 'og:description',
				content: 'Low-Code Finite State' + ' Machines',
			},
		],
		['link', { rel: 'icon', href: '/yantrix/favicon.ico' }],
		[
			'link',
			{
				rel: 'icon',
				type: 'image/png',
				href: '/yantrix/icon-white.png',
				sizes: '64x64',
			},
		],
		[
			'link',
			{
				rel: 'icon',
				type: 'image/png',
				href: '/yantrix/logo.png',
				sizes: '512x512',
			},
		],
	],
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: '/icon-white.png',
		siteTitle: 'Yantrix',
		socialLinks: [],
		outline: {
			level: [2, 3],
		},
		sidebar: getSidebarItems(path.resolve(__dirname, '../src')),
	},
});

function getMdData(filePath: string) {
	const fileContent = fs.readFileSync(filePath, 'utf-8');
	return matter(fileContent);
}

function getSortIndex(filePath: string) {
	const order = Number.parseInt(path.basename(filePath, '.md').split('_')[0]) || 0;
	const prefix = filePath
		.replace(/^\//, '')
		.split('/')
		.map(t => t.replaceAll('-', ' ').toLowerCase())
		.filter(t => menuOrder.includes(t))[0];
	const dirOrder = menuOrder.indexOf(prefix);
	return order + dirOrder * 1000;
}

function getFolderItem(folderDir: string, link: string): DefaultTheme.SidebarItem {
	const indexFile = path.join(folderDir, 'index.md');
	const name = path.basename(folderDir, '.md');

	if (fs.existsSync(indexFile)) {
		const frontmatter = getMdData(indexFile);
		return {
			text: frontmatter.data.title || name,
			collapsed: true,
			items: [],
			rel: getSortIndex(folderDir),
			link: frontmatter.content.length > 0 ? link : undefined,
		};
	} else {
		return {
			text: path.basename(folderDir),
			collapsed: true,
			rel: getSortIndex(folderDir),
			items: [],
		};
	}
}

function getFileItem(filePath: string, link: string): DefaultTheme.SidebarItem {
	const frontmatter = getMdData(filePath);
	const name = path.basename(filePath).replace('.md', '');
	return {
		text: frontmatter.data.title || name,
		rel: getSortIndex(filePath),
		link,
	};
}

/**
 * sort by
 * 1) index.md
 * 2) *.md
 * 3) *
 * @param files
 */
function sortFiles(files: string[]) {
	const indexMd = files.filter(file => file === 'index.md');
	const md = files.filter(file => file.endsWith('.md') && file !== 'index.md');
	const other = files.filter(file => !file.endsWith('.md'));

	return [...indexMd, ...md, ...other];
}

function getSidebarItems(startDir: string, baseDir = '') {
	const ignoreAbsolute = [path.resolve(startDir, 'public')];

	function _getSidebarItems(fileDir = '') {
		const absoluteDirPath = path.resolve(startDir, fileDir);
		const items = [] as DefaultTheme.SidebarItem[];
		const files = sortFiles(fs.readdirSync(absoluteDirPath));
		files.forEach((file) => {
			const absoluteFilePath = path.join(absoluteDirPath, file);
			const stat = fs.statSync(absoluteFilePath);

			if (ignoreAbsolute.includes(path.resolve(absoluteFilePath))) {
				return;
			}

			if (stat.isDirectory()) {
				const item = getFolderItem(absoluteFilePath, `/${path.join(baseDir, fileDir, file)}/`);
				item.items = _getSidebarItems(path.join(fileDir, file));
				items.push(item);
			} else if (file !== 'index.md') {
				const item = getFileItem(absoluteFilePath, `/${path.join(baseDir, fileDir, file)}`);
				items.push(item);
			}
		});

		return items;
	}

	const root = getFolderItem(startDir, '/');

	return [root, ..._getSidebarItems().sort((a, b) => Number.parseInt(a.rel) - Number.parseInt(b.rel))];
}

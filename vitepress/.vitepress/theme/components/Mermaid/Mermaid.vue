<template>
	<div class="diagram-holder">
		<div v-html="svg" :class="props.class" ref="diagram" v-if="!showCode" />
		<div class="toolbar">
			<Resize ref="resizeBtn" @click="openInFullscreen" />
			<Code @click="showCode = !showCode" />
			<CopyButton :text-to-copy="codeToCopy" />
		</div>
		<div v-if="showCode">
			<div v-html="svgCodeDisplay" />
		</div>
	</div>
	<Teleport to="body">
		<div class="diagram-full-size" ref="fullSizeDiagramHolderRef">
			<div v-html="svg" :class="[props.class, 'diagram']" ref="fullSizeDiagramRef" />
			<div class="toolbar">
				<Resize ref="resizeBtn" @click="closeFullscreen" />
			</div>
		</div>
	</Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, ref, toRaw } from 'vue';
import { render, init } from './mermaid';
import { codeToHtml } from 'shiki';
import { useData } from 'vitepress';
import Resize from '../../svgs/Resize.vue';
import { debounce } from '../../helpers/debounce';
import Code from '../../svgs/code.vue';
import CopyButton from './CopyButton.vue';

const pluginSettings = ref({
	securityLevel: 'loose',
	startOnLoad: false,
	externalDiagrams: [],
});
const { page } = useData();
const { frontmatter } = toRaw(page.value);
const mermaidPageTheme = frontmatter.mermaidTheme || '';

const props = defineProps({
	graph: {
		type: String,
		required: true,
	},
	id: {
		type: String,
		required: true,
	},
	class: {
		type: String,
		required: false,
		default: 'mermaid',
	},
});

const svg = ref(null);
const svgCodeDisplay = ref(null);
let showCode = ref(false);
let mut = null;
const codeToCopy = ref(null);

onMounted(async () => {
	await init(pluginSettings.value.externalDiagrams);
	let settings = await import('virtual:mermaid-config');
	if (settings?.default) pluginSettings.value = settings.default;

	mut = new MutationObserver(async () => await renderChart());
	mut.observe(document.documentElement, { attributes: true });
	await renderChart();

	//refresh images on first render
	const hasImages = /<img([\w\W]+?)>/.exec(decodeURIComponent(props.graph))?.length > 0;
	if (hasImages)
		setTimeout(() => {
			let imgElements = document.getElementsByTagName('img');
			let imgs = Array.from(imgElements);
			if (imgs.length) {
				Promise.all(
					imgs
						.filter((img) => !img.complete)
						.map(
							(img) =>
								new Promise((resolve) => {
									img.onload = img.onerror = resolve;
								}),
						),
				).then(async () => {
					await renderChart();
				});
			}
		}, 100);
});

onUnmounted(() => mut.disconnect());

const renderChart = async () => {
	const hasDarkClass = document.documentElement.classList.contains('dark');
	let mermaidConfig = {
		...pluginSettings.value,
	};

	if (mermaidPageTheme) mermaidConfig.theme = mermaidPageTheme;
	if (hasDarkClass) mermaidConfig.theme = 'dark';

	const decodedGraph = decodeURIComponent(props.graph);

	let svgCode = await render(props.id, decodedGraph, mermaidConfig);
	// This is a hack to force v-html to re-render, otherwise the diagram disappears
	// when **switching themes** or **reloading the page**.
	// The cause is that the diagram is deleted during rendering (out of Vue's knowledge).
	// Because svgCode does NOT change, v-html does not re-render.
	// This is not required for all diagrams, but it is required for c4c, mindmap and zenuml.
	const salt = Math.random().toString(36).substring(7);
	const code = await codeToHtml(decodedGraph, {
		lang: 'mermaid',
		theme: 'github-dark',
	});
	codeToCopy.value = decodedGraph;
	let htmlCode = `<div class="language-ts vp-adaptive-theme">${code}</div>`;
	htmlCode = htmlCode
		.replaceAll('shiki github-dark', 'shiki shiki-themes github-light github-dark vp-code')
		.replaceAll('style="background-color:#24292e;color:#e1e4e8"', '');
	svgCodeDisplay.value = htmlCode;
	svg.value = `${svgCode} <span style="display: none">${salt}</span>`;
};

const fullSizeDiagramHolderRef = ref(null);
const fullSizeDiagramRef = ref(null);
const openInFullscreen = () => {
	fullSizeDiagramHolderRef.value.classList.add('active');
	document.body.style.overflow = 'hidden';
	flexResize();
};

const closeFullscreen = () => {
	fullSizeDiagramHolderRef.value.classList.remove('active');
	document.body.style.overflow = '';
};

const flexResize = () => {
	if (fullSizeDiagramRef.value.getBoundingClientRect().height > window.innerHeight) {
		fullSizeDiagramHolderRef.value.classList.remove('flex');
	} else {
		fullSizeDiagramHolderRef.value.classList.add('flex');
	}
};

const debouncedFlexResize = debounce(flexResize, 200);

onMounted(() => {
	window.addEventListener('resize', debouncedFlexResize);
});

onUnmounted(() => {
	window.removeEventListener('resize', debouncedFlexResize);
});
</script>

<style scoped>
.toolbar {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 2;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 5px;
	& > * {
		width: fit-content;
		height: 40px;
		min-width: 40px;
		cursor: pointer;
		opacity: 0;
		border: 1px solid var(--vp-code-copy-code-border-color);
		border-radius: 4px;
		background-color: var(--vp-code-copy-code-bg);
		fill: rgba(128, 128, 128, 1);
		transition:
			border-color 0.25s,
			background-color 0.25s,
			opacity 0.25s;
	}
}

.diagram-holder,
.diagram-full-size {
	position: relative;
	&:hover .toolbar > * {
		opacity: 0.4;
		&:hover {
			border-color: var(--vp-code-copy-code-hover-border-color) !important;
			background-color: var(--vp-code-copy-code-hover-bg) !important;
		}
	}
	.toolbar:hover > * {
		opacity: 1;
	}
}

.diagram-full-size {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: var(--vp-c-bg);
	z-index: 9999;

	display: none;
	overflow: auto;

	.diagram {
		width: 100%;

		&:deep(svg) {
			max-width: none !important;
		}
	}
	.toolbar {
		opacity: 1;
	}

	&.active {
		display: block;

		&.flex {
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
}
</style>

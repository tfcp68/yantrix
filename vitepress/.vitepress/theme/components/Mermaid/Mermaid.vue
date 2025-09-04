<script setup>
import { codeToHtml } from 'shiki';
import { useData } from 'vitepress';
import { onMounted, onUnmounted, reactive, ref, toRaw } from 'vue';
import Code from '../../svgs/code.vue';
import Resize from '../../svgs/Resize.vue';
import CopyButton from './CopyButton.vue';
import { init, render } from './mermaid';

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
const pluginSettings = ref({
	securityLevel: 'loose',
	startOnLoad: false,
	externalDiagrams: [],
});
const { page } = useData();
const { frontmatter } = toRaw(page.value);
const mermaidPageTheme = frontmatter.mermaidTheme || '';

const svg = ref(null);
const svgCodeDisplay = ref(null);
const showCode = ref(false);
let mut = null;
const codeToCopy = ref(null);
const fullSizeDiagramHolderRef = ref(null);
const fullSizeDiagramRef = ref(null);

const position = reactive({ x: 0, y: 0 });
let isDragging = false;
let startX = 0;
let startY = 0;
const fullSizeIsOpen = ref(false);
let scale = 1;

onMounted(async () => {
	await init(pluginSettings.value.externalDiagrams);
	const settings = await import('virtual:mermaid-config');
	if (settings?.default)
		pluginSettings.value = settings.default;

	mut = new MutationObserver(async () => await renderChart());
	mut.observe(document.documentElement, { attributes: true });
	await renderChart();

	// refresh images on first render
	const hasImages = /<img([\s\S]+?)>/.exec(decodeURIComponent(props.graph))?.length > 0;
	if (hasImages) {
		setTimeout(() => {
			const imgElements = document.getElementsByTagName('img');
			const imgs = Array.from(imgElements);
			if (imgs.length) {
				Promise.all(
					imgs
						.filter(img => !img.complete)
						.map(
							img =>
								new Promise((resolve) => {
									img.onload = img.onerror = resolve;
								}),
						),
				).then(async () => {
					await renderChart();
				});
			}
		}, 100);
	}
});

onUnmounted(() => mut.disconnect());

async function renderChart() {
	const hasDarkClass = document.documentElement.classList.contains('dark');
	const mermaidConfig = {
		...pluginSettings.value,
	};

	if (mermaidPageTheme)
		mermaidConfig.theme = mermaidPageTheme;
	if (hasDarkClass)
		mermaidConfig.theme = 'dark';

	const decodedGraph = decodeURIComponent(props.graph);

	const svgCode = await render(props.id, decodedGraph, mermaidConfig);
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
}

function openInFullscreen() {
	fullSizeIsOpen.value = true;
	fullSizeDiagramHolderRef.value && fullSizeDiagramHolderRef.value.classList.add('active');
	document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
	fullSizeIsOpen.value = false;
	fullSizeDiagramHolderRef.value && fullSizeDiagramHolderRef.value.classList.remove('active');
	document.body.style.overflow = '';
}

function onZoom(e) {
	if (!fullSizeIsOpen.value)
		return;
	e.preventDefault();

	const currentScale = scale || 1;
	const scaleMultiplier = 1.2;

	if (e.deltaY > 0 && currentScale > 0.1) {
		scale = Math.max(0.1, currentScale / scaleMultiplier);
	}
	else if (e.deltaY < 0 && currentScale < 3) {
		scale = Math.min(3, currentScale * scaleMultiplier);
	}

	updateTransform();
}

function onMouseDown(e) {
	if (!fullSizeIsOpen.value || e.button !== 0)
		return;
	isDragging = true;
	startX = e.clientX - position.x;
	startY = e.clientY - position.y;
	document.body.style.cursor = 'grabbing';
	e.preventDefault();
}

function onMouseMove(e) {
	if (!isDragging || !fullSizeIsOpen.value)
		return;
	position.x = e.clientX - startX;
	position.y = e.clientY - startY;
	updateTransform();
}

function onMouseUp() {
	if (!fullSizeIsOpen.value)
		return;
	isDragging = false;
	document.body.style.cursor = '';
}

function updateTransform() {
	if (fullSizeDiagramRef.value && fullSizeIsOpen.value) {
		fullSizeDiagramRef.value.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
	}
}

onMounted(() => {
	window.addEventListener('wheel', onZoom, { passive: false });
	document.addEventListener('mousedown', onMouseDown);
	document.addEventListener('mousemove', onMouseMove);
	document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
	window.removeEventListener('wheel', onZoom);
	document.removeEventListener('mousedown', onMouseDown);
	document.removeEventListener('mousemove', onMouseMove);
	document.removeEventListener('mouseup', onMouseUp);
	closeFullscreen();
});
</script>

<template>
	<div class="diagram-holder">
		<div v-if="!showCode" :class="props.class" v-html="svg" />
		<div class="toolbar">
			<Resize @click="openInFullscreen" />
			<Code @click="showCode = !showCode" />
			<CopyButton :text-to-copy="codeToCopy" />
		</div>
		<div v-if="showCode">
			<div v-html="svgCodeDisplay" />
		</div>
	</div>
	<Teleport to="body">
		<div ref="fullSizeDiagramHolderRef" class="diagram-full-size">
			<div ref="fullSizeDiagramRef" class="diagram" :class="[props.class]" v-html="svg" />
			<div class="toolbar">
				<Resize @click="closeFullscreen" />
			</div>
		</div>
	</Teleport>
</template>

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
	overflow: hidden;

	.diagram {
		width: 100%;
		height: 100%;
		margin:auto;
		&:deep(svg) {
			height: 100%;
			max-width: none !important;
		}
	}
	.toolbar {
		opacity: 1;
	}

	&.active {
		display: block;
	}
}
</style>

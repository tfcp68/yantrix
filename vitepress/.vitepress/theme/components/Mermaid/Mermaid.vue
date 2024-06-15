<template>
	<div class="diagram-holder">
		<div v-html="svg" :class="props.class" ref="diagram" />
		<div class="toolbar">
			<Resize ref="resizeBtn" @click="openInFullscreen" />
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

//get mermaid settings
import { useData } from 'vitepress';
import Resize from '../../svgs/Resize.vue';
import { debounce } from '../../helpers/debounce';

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
let mut = null;

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

	let svgCode = await render(props.id, decodeURIComponent(props.graph), mermaidConfig);
	// This is a hack to force v-html to re-render, otherwise the diagram disappears
	// when **switching themes** or **reloading the page**.
	// The cause is that the diagram is deleted during rendering (out of Vue's knowledge).
	// Because svgCode does NOT change, v-html does not re-render.
	// This is not required for all diagrams, but it is required for c4c, mindmap and zenuml.
	const salt = Math.random().toString(36).substring(7);
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
	& > * {
		width: 40px;
		height: 40px;
		cursor: pointer;
	}
	transition: 0.1s;
	opacity: 0.1;
}

.diagram-holder {
	position: relative;
	&:hover .toolbar {
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

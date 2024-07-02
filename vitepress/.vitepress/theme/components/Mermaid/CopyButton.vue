<template>
	<div>
		<CopySVG fill="none" @click="copy" v-if="!isCopied" />
		<CopyCopiedSVG v-if="isCopied" />
	</div>
</template>

<script setup>
import { ref } from 'vue';
import CopySVG from '../../svgs/CopySVG.vue';
import CopyCopiedSVG from '../../svgs/CopyCopiedSVG.vue';

const props = defineProps({
	textToCopy: String,
});

const isCopied = ref(false);
const copy = () => {
	navigator.clipboard.writeText(props.textToCopy);

	isCopied.value = true;

	setTimeout(() => {
		isCopied.value = false;
	}, 2000);
};
</script>

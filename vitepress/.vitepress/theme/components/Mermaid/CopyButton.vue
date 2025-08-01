<script setup>
import { ref } from 'vue';
import CopyCopiedSVG from '../../svgs/CopyCopiedSVG.vue';
import CopySVG from '../../svgs/CopySVG.vue';

const props = defineProps({
	textToCopy: String,
});

const isCopied = ref(false);
function copy() {
	navigator.clipboard.writeText(props.textToCopy);

	isCopied.value = true;

	setTimeout(() => {
		isCopied.value = false;
	}, 2000);
}
</script>

<template>
	<div>
		<CopySVG v-if="!isCopied" fill="none" @click="copy" />
		<CopyCopiedSVG v-if="isCopied" />
	</div>
</template>

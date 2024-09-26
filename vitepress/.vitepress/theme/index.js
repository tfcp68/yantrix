import DefaultTheme from 'vitepress/theme';
import Mermaid from './components/Mermaid/Mermaid.vue';
import './custom.css';

export default {
	...DefaultTheme,
	enhanceApp({ app }) {
		app.component('Mermaid', Mermaid);
	},
};

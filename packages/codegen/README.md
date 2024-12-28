# `@yantrix/codegen`

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

Code generation engine for [Yantrix](https://tfcp68.github.io/yantrix/) framework that transforms extendend Mermaid state diagrams into type-safe finite state machine implementations. Supports multiple target languages including TypeScript, JavaScript, Java and Python, with extensible architecture for adding new language targets.
<p>
	<a href="https://github.com/tfcp68/yantrix/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml" target="_blank"><img src="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml/badge.svg" alt="ci"></a>
	<a href="https://www.npmjs.com/package/@yantrix/codegen"><img src="https://img.shields.io/npm/v/@yantrix/codegen.svg?maxAge=3600" alt="npm version" /></a>
	<a href="https://www.npmjs.com/package/@yantrix/codegen"><img src="https://img.shields.io/npm/dt/@yantrix/codegen.svg?maxAge=3600" alt="npm downloads" /></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
</p>
## 📖 Usage

Install the primary package using your prefered package manager. All the secondary dependencies will be installed automatically.

```bash
# Via NPM
$ npm install @yantrix/codegen

# Via Yarn
$ yarn add @yantrix/codegen

# Via PNPM
$ pnpm install @yantrix/codegen

# ✨ Auto-detection
$ npx nypm install @yantrix/codegen
```

> We suggest using `pnpm`

After installation, you can use `@yantrix/codegen` in your TypeScript/JavaScript project to generate automata from Mermaid state diagrams for your needs.

```typescript
import {
	createStateDiagram,
	generateAutomataFromStateDiagram,
	parseStateDiagram
} from '@yantrix/codegen';

// Your Mermaid state diagram
const mermaidDiagram = `
stateDiagram-v2
[*] --> Idle
Idle --> Moving
Moving --> Idle
Moving --> Crashed
Crashed --> Idle
`;

// Parse the diagram into a structured object
const parsedDiagram = await parseStateDiagram(mermaidDiagram);

// Create a state diagram matrix of states and transitions
const matrix = await createStateDiagram(parsedDiagram);

// Generate TypeScript code
const generatedCode = await generateAutomataFromStateDiagram(matrix, {
	language: 'TypeScript',
	className: 'MovementAutomata'
});

// Write the code to a file
writeFileSync('MovementAutomata.ts', generatedCode);
```

And finally, you can use the generated code in your project:

```typescript
import { MovementAutomata } from './MovementAutomata';
```

For more info, please refer to the [documentation](https://tfcp68.github.io/yantrix/integrations/150_JSAPI.html).

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)
## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).

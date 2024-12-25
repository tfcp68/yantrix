# `@yantrix/cli`

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

Command-line interface for [Yantrix](https://github.com/tfcp68/yantrix/) framework. This package is a console wrapper for certain Yantrix tooling, most notably [code generation](https://www.npmjs.com/package/@yantrix/codegen)

<a href="https://github.com/tfcp68/yantrix/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml" target="_blank"><img src="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml/badge.svg" alt="ci"></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">

## 📖 Usage

Install both `@yantrix/cli` and `@yantrix/codegen` using your prefered package manager. All the secondary dependencies will be installed automatically.

```bash
# Via NPM
$ npm install @yantrix/codegen @yantrix/cli

# Via Yarn
$ yarn add @yantrix/codegen @yantrix/cli

# Via PNPM
$ pnpm install @yantrix/codegen @yantrix/cli

# ✨ Auto-detection
$ npx nypm install @yantrix/codegen @yantrix/cli
```

> We suggest using `pnpm`

To use code generation, invoke the following:
```bash
yantrix codegen ...
```

See more:
- [Quick start in Typescript](https://tfcp68.github.io/yantrix/)
- [Learn language options](https://tfcp68.github.io/yantrix/integrations/100_language_support.html)
- [Diagram examples](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)
  
## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)  
## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).

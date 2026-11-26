# `@yantrix/providers`

`@yantrix/providers` supplies an interval timer `Source` and a paired HTTP `Source` and `Destination`.

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

<p>
	<a href="./LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://tfcp68.github.io/yantrix/API/providers/test_cases/providers.html" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/tfcp68/yantrix/ubuntu-latest-test.yml?branch=main&amp;label=ci" alt="ci"></a>
	<a href="https://www.npmjs.com/package/@yantrix/providers"><img src="https://img.shields.io/npm/v/@yantrix/providers.svg?maxAge=3600" alt="npm version" /></a>
	<a href="https://www.npmjs.com/package/@yantrix/providers"><img src="https://img.shields.io/npm/dt/@yantrix/providers.svg?maxAge=3600" alt="npm downloads" /></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
</p>

## 📖 Usage

```sh
npm install @yantrix/providers
```

```typescript
import { IntervalTimerDataSource } from '@yantrix/providers';

const timer = new IntervalTimerDataSource({ id: 'clock', interval: 1000 });
timer.addListener('tick', packet => [{ event: 1, meta: { timestamp: packet.timestamp } }]);
const events = timer.eventEmitter();
timer.start();
// Poll events.next() from the application's scheduling loop.
timer.stop();
```

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)

## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).

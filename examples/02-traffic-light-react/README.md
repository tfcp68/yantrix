<div align="center">
  <img width="128" src="https://github.com/tfcp68/yantrix/blob/main/docs/public/logo.png?raw=true" />
  <h1><code>Traffic Light React Example</code></h1>
  <p>A simple example showcasing the integration of the Yantrix framework with React, showcasing how to create a state machine, use it in a React component, and handle events and state changes.</p>
</div>

## 📖 Documentation

Documentation of the following example can be found [here](https://tfcp68.github.io/yantrix/examples/110_react.html).

## ⭐ Installation and usage

If you want to run this example locally, follow these steps:
1. Clone into the Yantrix repository:
```
git clone https://github.com/tfcp68/yantrix.git
```
2. Open the example folder:
```
cd yantrix
cd examples
cd 02-traffic-light-react
```
3. Install the dependencies:
```
pnpm install
```
4. To run the project in development mode:
```
pnpm dev
// Check out the example at http://localhost:5173
```
5. To build for production:
```
pnpm build
```
For more information on how the example works, refer to the documentation.

## Source diagram

```
stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch
note right of [*]
#{ counter = 0 } <= coalesce($initialCounter, inc(#counter))
end note
note left of Off
+Init
end note
```
Detailed explanation on the diagram syntax can be found [here](https://tfcp68.github.io/yantrix/syntax/).

## 🌱 Contributing

See [Contributing](https://tfcp68.github.io/yantrix/contributing/)

## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).

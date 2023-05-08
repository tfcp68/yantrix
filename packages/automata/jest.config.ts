import {Config} from "jest";

const config: Config = {
	verbose: true,
	collectCoverage: true,
	testEnvironment: 'node',
	preset: 'ts-jest',
	coverageReporters: ['text', 'lcov', 'cobertura'],
	transform: {
		"^.+\\.tsx?$": "ts-jest"
	},
	testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
	moduleFileExtensions: [
		"ts",
		"tsx",
		"js",
		"jsx",
		"json",
		"node"
	]
}

export default config
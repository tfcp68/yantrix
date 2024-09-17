import { randomDecimal, randomInteger, randomString } from './../../../utils/src/fixtures';

const assignTypes = ['string', 'decimal', 'integer', 'list', 'payload', 'context', 'constant', 'payload'];

export const constant = {
	pi: 3.14,
};

export function getRandomPayload() {
	const rnd = randomInteger(0, 120);

	if (rnd < 30) {
		return randomInteger;
	}
	if (rnd >= 30 && rnd < 60) {
		return randomString;
	}
	if (rnd >= 60 && rnd < 90) {
		return randomDecimal;
	}
	if (rnd >= 90 && rnd < 120) {
		return () => [];
	}

	return randomString;
}

export function generateAssign(type: typeof assignTypes[number]) {
	switch (type) {
		case 'string':
			return (() => {
				const value = randomString();
				const ident = randomString();

				return {
					input: `${ident} = '${value}'`,
					ident,
					value,
					referenceType: null,
					payloadIdent: null,
				};
			})();
		case 'payload':
			return (() => {
				const ident = randomString();
				const payload = getRandomPayload()();
				const payloadIdent = randomString();

				return {
					input: `${ident} = $${payloadIdent}`,
					ident,
					payloadIdent,
					value: payload,

					referenceType: 'payload',
				};
			})();

		case 'constant':
			return (() => {
				const ident = randomString();
				const constantReference = randomString();

				return {
					input: `${ident} = %%pi`,
					ident,
					constantReference,
					value: constant.pi,
					referenceType: 'constant',
					payloadIdent: null,
				};
			})();

		case 'context':
			return (() => {
				const ident = randomString();

				return {
					input: `${ident} = #${randomString()}`,
					ident,
					value: null,
					payloadIdent: null,
					referenceType: 'context',

				};
			})();

		case 'decimal':
			return (() => {
				const ident = randomString();
				const value = randomDecimal();

				return {
					input: `${ident} = ${value}`,
					ident,
					value,
					referenceType: null,
					payloadIdent: null,
				};
			})();

		case 'integer':
			return (() => {
				const ident = randomString();
				const value = randomInteger();

				return {
					input: `${ident} = ${value}`,
					ident,
					value,
					referenceType: null,
					payloadIdent: null,
				};
			})();

		case 'list':
			return (() => {
				const ident = randomString();

				return {
					input: `${ident} = []`,
					ident,
					value: [],
					payloadIdent: null,
					referenceType: null,
				};
			})();

		default:
			throw new Error('Unknown assign type');
	}
}

export function getReferenceAssign(startIdentSymbol?: string) {
	return assignTypes.map((type) => {
		const assign = generateAssign(type);

		if (!startIdentSymbol) {
			return assign;
		}

		const ctxAssign = startIdentSymbol.concat(assign.input);

		return {
			...assign,
			input: ctxAssign,
		};
	});
}

export function generateAssignCase(input: string, name: string, output: ReturnType<typeof generateAssign>[]) {
	return {
		input,
		name,
		output: output.reduce((acc, curr) => {
			// @ts-expect-error idk
			acc[curr.ident] = curr.value;

			return acc;
		}, {}),
		dispatchObject: output.reduce((acc, curr) => {
			if (curr.referenceType === 'payload') {
				// @ts-expect-error idk
				acc[curr.payloadIdent] = curr.value;
			}
			return acc;
		}, {}),
	};
}

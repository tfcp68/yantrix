import { randomDecimal, randomString, randomInteger } from './../../../utils/src/fixtures';

const assignTypes = ['string', 'decimal', 'integer', 'list', 'payload', 'context', 'constant', 'payload'];

export const constant = {
	pi: 3.14,
};

export const getRandomPayload = () => {
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

	throw new Error('');
};

export const generateAssign = (type) => {
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
				};
			})();

		case 'context':
			return (() => {
				const ident = randomString();

				return {
					input: `${ident} = #${randomString()}`,
					ident,
					value: null,
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
				};
			})();

		case 'list':
			return (() => {
				const ident = randomString();

				return {
					input: `${ident} = []`,
					ident,
					value: [],
					referenceType: null,
				};
			})();

		default:
			throw new Error('Unknown assign type');
	}
};

export const getReferenceAssign = (startIdentSymbol?: string) => {
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
};

export const generateAssignCase = (input: string, name: string, output) => {
	return {
		input,
		name,
		output: output.reduce((acc, curr) => {
			acc[curr.ident] = curr.value;

			return acc;
		}, {}),
		dispatchObject: output.reduce((acc, curr) => {
			if (curr.referenceType === 'payload') {
				acc[curr.payloadIdent] = curr.value;
			}
			return acc;
		}, {}),
	};
};

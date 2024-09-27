import { randomDecimal, randomInteger, randomString } from './../../../utils/src/fixtures';

const assignTypes = ['string', 'decimal', 'integer', 'list', 'payload', 'context', 'constant', 'payload'] as const;

export const constant = {
	pi: 3.14,
};

const payloadList = [randomInteger, randomString, randomDecimal, () => []];

export function getRandomPayload() {
	const randomIndex = Math.floor(Math.random() * payloadList.length);

	if (payloadList[randomIndex]) return payloadList[randomIndex];
	return randomString;
}

type TDefaultCase = {
	input: string;
	ident: string;
	value: any;
	referenceType: string | null;
	payloadIdent: string | null;
};

const defaultCase = (ident: string, value: string) => {
	return {

		input: `${ident} = '${value}'`,
		ident,
		value,
		referenceType: null,
		payloadIdent: null,
	};
};

const asssignMap: Record<typeof assignTypes[number], (ident: string) => TDefaultCase> = {
	string: (ident: string) => {
		return defaultCase(ident, randomString());
	},
	decimal: (ident: string) => {
		return defaultCase(ident, `${randomDecimal()}`);
	},
	integer: (ident: string) => {
		return defaultCase(ident, `${randomInteger()}`);
	},
	list: (ident: string) => {
		return defaultCase(ident, `[]`);
	},
	payload: (ident: string) => {
		const payload = getRandomPayload()();
		const payloadIdent = randomString();

		return {
			input: `${ident} = $${payloadIdent}`,
			ident,
			payloadIdent,
			value: payload,

			referenceType: 'payload',
		};
	},
	context: (ident: string) => {
		return {
			input: `${ident} = #${randomString()}`,
			ident,
			value: null,
			payloadIdent: null,
			referenceType: 'context',
		};
	},
	constant: (ident: string) => {
		const constantReference = randomString();

		return {
			input: `${ident} = %%pi`,
			ident,
			constantReference,
			value: constant.pi,
			referenceType: 'constant',
			payloadIdent: null,
		};
	},
};

export function generateAssign(type: typeof assignTypes[number]) {
	const ident = randomString();
	return asssignMap[type](ident);
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

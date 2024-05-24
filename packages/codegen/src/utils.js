'use strict';
var __assign =
	(this && this.__assign) ||
	function () {
		__assign =
			Object.assign ||
			function (t) {
				for (var s, i = 1, n = arguments.length; i < n; i++) {
					s = arguments[i];
					for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
				}
				return t;
			};
		return __assign.apply(this, arguments);
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.Codegen = exports.toTypedObject = exports.toTypedObjectProps = exports.toUpperFirst = void 0;
var automata_1 = require('@yantrix/automata');
var toUpperFirst = function (str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.toUpperFirst = toUpperFirst;
var toTypedObjectProps = function (object, objName) {
	var typeGuardName = 'isValid'.concat((0, exports.toUpperFirst)(objName));
	var typeName = 'T'.concat((0, exports.toUpperFirst)(objName));
	var body = JSON.stringify(object, null, 2);
	var name = ''.concat(objName, 'Obj');
	return {
		typeName: typeName,
		typeGuardName: typeGuardName,
		name: name,
		body: body,
	};
};
exports.toTypedObjectProps = toTypedObjectProps;
var toTypedObject = function (obj, name) {
	var props = (0, exports.toTypedObjectProps)(obj, name);
	var codeBlock = 'const '
		.concat(props.name, ' = ')
		.concat(props.body, '\n\n\t\ttype ')
		.concat(props.typeName, ' = keyof typeof ')
		.concat(props.name, '\n\n\t\tconst ')
		.concat(props.typeGuardName, ' = (obj: any): obj is ')
		.concat(props.typeName, ' => {\n\t\t\treturn Object.keys(')
		.concat(props.name, ').includes(obj);\n\t\t}');
	return __assign(__assign({}, props), { codeBlock: codeBlock });
};
exports.toTypedObject = toTypedObject;
var Codegen = /** @class */ (function () {
	function Codegen(diagram) {
		this.actionDictionary = new automata_1.BasicActionDictionary();
		this.stateDictionary = new automata_1.BasicStateDictionary();
		this.diagram = diagram;
		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];
		this.fillDictionaries();
		this.initialState = Object.values(this.stateDictionary.getDictionary())[0];
		this.setupHandlers();
		this.setupDictionaries();
	}
	Codegen.prototype.getActionToStateDict = function (transitions) {
		var _this = this;
		return Object.keys(transitions).map(function (key) {
			var actionsPath = transitions[key].actionsPath;
			var newState = _this.stateDictionary.getStateValues({ keys: [key] });
			return actionsPath.map(function (_a) {
				var action = _a.action;
				var actionValue = _this.actionDictionary.getActionValues({
					keys: action,
				});
				return ''.concat(actionValue[0], ':').concat(newState[0], ',');
			});
		});
	};
	Codegen.prototype.getHandlerDict = function (state) {
		var stateValue = this.stateDictionary.getStateValues({
			keys: [state],
		})[0];
		return ''.concat(stateValue, ': handleStateChange').concat(stateValue, ', \n');
	};
	Codegen.prototype.fillDictionaries = function () {
		var stateKeys = this.diagram.states.map(function (s) {
			return s.id;
		});
		this.stateDictionary.addStates({ keys: stateKeys });
		for (var _i = 0, _a = this.diagram.states; _i < _a.length; _i++) {
			var state = _a[_i];
			for (
				var _b = 0,
					_c = state.actionsPath.map(function (p) {
						return p.action;
					});
				_b < _c.length;
				_b++
			) {
				var path = _c[_b];
				var fullPath = path.join('');
				var isUniqueAction = this.actionDictionary.getActionValues({ keys: [fullPath] })[0] === null;
				if (!isUniqueAction) {
					continue;
				}
				this.actionDictionary.addActions({ keys: [path.join(' ')] });
			}
		}
	};
	Codegen.prototype.getHandleStateChanges = function (transitions, state) {
		var value = this.stateDictionary.getStateValues({ keys: [state] });
		return 'const handleStateChange'
			.concat(
				value,
				' = ({payload,action,context:prevContext,state}:{state:number|null, action:number, payload:any, context:any}) => {\n         const actionToStateDict = {\n              ',
			)
			.concat(
				this.getActionToStateDict(transitions)
					.flatMap(function (el) {
						return el;
					})
					.join('\n'),
				'     \n         };\n        // @ts-expect-error okay\n        const newState = actionToStateDict[action] ?? state\n        const isNewState = newState !== state\n        \n        return {state:isNewState ? newState : state, context:isNewState ? {...payload} : {...prevContext}}\n    };',
			);
	};
	Codegen.prototype.setupHandlers = function () {
		var _this = this;
		this.handlersDict.push('const handlersDict = {');
		Object.keys(this.diagram.transitions).map(function (state) {
			_this.handlersDict.push(_this.getHandlerDict(state));
			_this.changeStateHandlers.push(_this.getHandleStateChanges(_this.diagram.transitions[state], state));
		});
		this.handlersDict.push(' }');
	};
	Codegen.prototype.setupDictionaries = function () {
		this.dictionaries.push(
			'export const statesDictionary = '.concat(JSON.stringify(this.stateDictionary.getDictionary(), null, 2)),
		);
		this.dictionaries.push(
			'export const actionsDictionary = '.concat(JSON.stringify(this.actionDictionary.getDictionary(), null, 2)),
		);
	};
	Codegen.prototype.getClassTemplate = function (className) {
		return 'export class '
			.concat(
				className,
				' extends GenericAutomata {\n  \t\tpublic constructor() {\n  \t\t\tsuper();\n  \t\t\tthis.init({\n  \t\t\t\tstate: ',
			)
			.concat(
				this.initialState,
				',\n  \t\t\t\tcontext: { index: -1 },\n          rootReducer: ({ action, context, payload, state }) => {\n            if (!action || payload === null) return { state, context };\n\n             // @ts-expect-error okay\n             return handlersDict[state]({action,payload,context,state})\n  \t\t\t\t},\n  \t\t\t\t// @ts-expect-error okay\n  \t\t\t\tstateValidator: (s) => Object.values(statesDictionary).includes(s),\n  \t\t\t\t// @ts-expect-error okay\n  \t\t\t\tactionValidator: (a) => Object.values(actionsDictionary).includes(a),\n  \t\t\t\t// @ts-expect-error okay\n  \t\t\t\teventValidator: () => {},\n  \t\t\t});\n  \t\t}\n  \t}',
			);
	};
	return Codegen;
})();
exports.Codegen = Codegen;

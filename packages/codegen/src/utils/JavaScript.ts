export const JavaScriptTemplate = `
export class %CLASSNAME% extends GenericAutomata {

    static id = %ID%;
    static actions = %ACTIONS_MAP%;
    static states = %STATES_MAP%;
    static getState = %GET_STATE%;
    static hasState = %HAS_STATE%;
    static getAction = %GET_ACTION%;
    static createAction = %CREATE_ACTION%;

    constructor() {
        super(eventAdapter);
        this.init({
            state: %STATE%,
            context:%CONTEXT%,
            rootReducer: %REDUCER%,
            stateValidator: %STATE_VALIDATOR%,
            actionValidator: %ACTION_VALIDATOR%,
            functionRegistry: %FUNCTION_REGISTRY%
        });
        %initContext%
    }

    isKeyOf = %IS_KEY_OF%;
}

export default %CLASSNAME%;`;

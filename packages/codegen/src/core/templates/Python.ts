export const PythonTemplate = `
class %CLASSNAME%:
    def __init__(self):
        super().__init__()
        self.state: %STATE%,
        self.context': %CONTEXT%,
        self.functionRegistry': %F_REGISTRY%

        self.id = %ID%
        self.actions = %ACTIONS_MAP%
        self.states = %STATES_MAP%

    %GET_STATE%

    %HAS_STATE%

    %GET_ACTION%

    %CREATE_ACTION%

    %REDUCER%

    %S_VALIDATOR%

    %A_VALIDATOR%

    %IS_KEY_OF%
`;

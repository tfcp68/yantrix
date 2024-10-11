export const PythonTemplate = `
class %CLASSNAME%: # (GenericAutomata)

    id = %ID%
    actions = %ACTIONS_MAP%
    states = %STATES_MAP%

    %GET_STATE%

    %HAS_STATE%

    %GET_ACTION%

    %CREATE_ACTION%

    %REDUCER%

    def __init__(self):
        super().__init__()
        self.state: %STATE%,
        self.context': %CONTEXT%,
        self.functionRegistry': %F_REGISTRY%

    %S_VALIDATOR%

    %A_VALIDATOR%

    %IS_KEY_OF%
`;

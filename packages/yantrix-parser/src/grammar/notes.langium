grammar YantrixLanguage

hidden terminal WS: /\s+/;
terminal FUNCTION_CALL: /[A-Za-z]{1,}[A-Za-z0-9\.]*([(])/;
terminal ID: /[a-zA-Z]\w{0,254}/;
terminal STRING: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;
terminal DECIMAL returns number: /-?(\d*\.)?\d+/ ;
terminal INT returns number: /-?\d+/ ;

interface Expression {
  inner?:Expression
}
interface StatementI {}
interface Immutable extends Expression {}
interface DataObjectReference extends Expression {}
interface ArgumentReference extends Expression {
    name: string;
}
interface ByPassStatement extends StatementI {
    byPass: boolean;
}

interface InitialStateStatement extends StatementI {
    initialState: boolean;
}

interface ArrayLiteral extends Immutable {
    elements: Expression[];
}

interface StringLiteral extends Immutable {
    value: string;
}

interface NumberLiteral extends Immutable {
    value: number;
}

entry Model:
    (statements+=Statement)*;

Statement:
    InitialState |
    ByPassStatement |
    ContextStatement |
    EmitStatement |
    SubscribeStatement |
    DefineStatement |
    InjectStatement |
    ExpressionStatement;

ByPassStatement returns ByPassStatement:
    {ByPassStatement} '+ByPass';

InitialState returns InitialStateStatement:
    {InitialStateStatement} '+Init';

ContextStatement:
    '#' '{' (keyItems=RawKeyItemsList) '}'
    ('<=' reducerItems=KeyItemsList)?;

EmitStatement:
    'emit/' identifier=ID
    ('(' (metaItems=KeyItemsList) ')')?
    ('<=' '#' '{' (contextItems=RawKeyItemsList)? '}')?;

SubscribeStatement:
    'subscribe/' eventIdentifier=ID actionName=ID
    ('(' (payloadItems=KeyItemsList) ')')?
    ('<=' '(' (metaItems=KeyItemsList)? ')')?;

RawKeyItemsList:
    (keyItemsRaw+=RawKeyItem (',' keyItemsRaw+=RawKeyItem)*);
KeyItemsList:
    (keyItems+=KeyItem (',' keyItems+=KeyItem)*);

DefineStatement:
    'define/' identifier=ID
    '(' (arguments+=ID (',' arguments+=ID)*)? ')'
    '=>' function=DefineFunction;

InjectStatement:
    'inject/' identifier=ID;

ExpressionStatement:
    '=' expression=Expression '?';

RawKeyItem:
    identifier=ID ('=' expression=Expression)?;

KeyItem:
    DataObject | Immutable | FunctionCall;

DataObject:
    reference=DataObjectReference ('=' expression=Expression)?;

DataObjectReference  returns DataObjectReference:
    Constant | PayloadReference | ContextReference;

Constant:
    '%%' identifier=ID;

PayloadReference:
    '$' identifier=ID;

ContextReference:
    '#' identifier=ID;

DefineFunction:
    FunctionCall | Immutable | Constant | ArgumentReference;

ArgumentReference returns ArgumentReference:
    name=ID;

FunctionCall:
    name=FUNCTION_CALL (arguments+=Expression (',' arguments+=Expression)*)? ')';


Expression returns Expression:
    Immutable | DataObject | FunctionCall | ArgumentReference;

Immutable returns Immutable:
    ArrayLiteral | StringLiteral | NumberLiteral;

ArrayLiteral returns ArrayLiteral:
    {ArrayLiteral} '[]';

StringLiteral returns StringLiteral:
    value=STRING;

NumberLiteral returns NumberLiteral:
    value=INT | value=DECIMAL;








grammar Yantrix

entry Document:
    (statements+=Statement)*;

Statement:
    InitialState | ByPass | ContextStatement | EmitStatement | 
    SubscribeStatement | DefineStatement | InjectStatement | ExpressionStatement;

InitialState:
    {infer InitialState} '+' ('Init' | 'INIT' | 'init');

ByPass:
    {infer ByPass} '+' ('ByPass' | 'BYPASS' | 'bypass');

ContextStatement:
    '#' '{' items+=RawKeyItem (',' items+=RawKeyItem)* '}' 
    ('<=' reducer+=KeyItem (',' reducer+=KeyItem)*)?;

EmitStatement:
    'emit/' identifier=ID 
    ('(' meta+=KeyItem (',' meta+=KeyItem)* ')')? 
    ('<=' '#' '{' context+=RawKeyItem (',' context+=RawKeyItem)* '}')?;

SubscribeStatement:
    'subscribe/' identifier=ID actionName=ID 
    ('(' payload+=KeyItem (',' payload+=KeyItem)* ')')? 
    ('<=' '(' metaItems+=KeyItem (',' metaItems+=KeyItem)* ')')?;

DefineStatement:
    'define/' identifier=ID '(' (args+=ID (',' args+=ID)*)? ')' '=>' expression=DefineExpression;

InjectStatement:
    'inject/' identifier=ID;

ExpressionStatement:
    '=' expression=Expression '?';

RawKeyItem:
    identifier=ID ('=' defaultValue=Expression)?;

KeyItem:
    DataObject | ImmutableValue | FunctionCall;

DefineExpression:
    DefineFunction | ImmutableValue | Constant;

DefineFunction:
    name=ID '(' (args+=DefineArgument (',' args+=DefineArgument)*)? ')';

DefineArgument:
    ImmutableValue | Constant | IdentifierRef | NestedDefineFunction;

NestedDefineFunction:
    name=ID '(' (args+=DefineArgument (',' args+=DefineArgument)*)? ')';

IdentifierRef:
    identifier=ID;

Expression:
    ImmutableValue | DataObject | FunctionCall;

FunctionCall:
    name=(ID | INTERNAL_FUNCTION_ID) '(' (args+=Expression (',' args+=Expression)*)? ')';

DataObject:
    reference=DataObjectReference ('=' assignedExpression=Expression)?;

DataObjectReference:
    Constant | PayloadReference | ContextReference;

Constant:
    '%%' identifier=ID;

PayloadReference:
    '$' identifier=ID;

ContextReference:
    '#' identifier=ID;

ImmutableValue:
    ArrayLiteral | StringLiteral | NumberLiteral;

ArrayLiteral:
    {infer ArrayLiteral} '[]';

StringLiteral:
    value=STRING;

NumberLiteral:
    value=NUMBER;

hidden terminal WS: /[\s\t]+/;
hidden terminal NL: /[\r\n]+/;

terminal INTERNAL_FUNCTION_ID: /_[a-zA-Z][a-zA-Z0-9_]{0,254}/;
terminal ID: /[a-zA-Z][a-zA-Z0-9_]{0,254}/;
terminal STRING: /'[^']*'|"[^"]*"/;
terminal NUMBER: /-?[0-9]+(\.[0-9]+)?/;


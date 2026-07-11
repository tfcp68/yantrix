DefineStatement:
    'define/' identifier=ID '(' (args+=ID (',' args+=ID)*)? ')' '=>' expression=DefineExpression;

InjectStatement:
    'inject/' identifier=ID;

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
    Constant | PayloadReference | ContextReference | PacketReference;

Constant:
    '%%' identifier=ID;

PayloadReference:
    '$' identifier=ID;

ContextReference:
    '#' identifier=ID;

PacketReference:
    '@' identifier=ID;

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

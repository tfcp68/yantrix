grammar Yantrix

import './yantrix-common';

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

ExpressionStatement:
    '=' expression=Expression '?';

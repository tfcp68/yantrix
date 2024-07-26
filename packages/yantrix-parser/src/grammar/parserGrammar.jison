

%{
  import {ReservedList, ExpressionTypes} from './index.js'
%}

%lex

%options case-insensitive

%%

<<EOF>>                              return 'EOF';
[\r\n]+                              return 'NewLine';
'%%'                             return 'CONSTANT_SYMBOL';
[\s]+                                /* skip all whitespace */
[A-Za-z]{1,}[A-Za-z0-9\.]*(?=[(])    return 'FUNCTION_NAME';
'subscribe'                          return 'SUBSCRIBE'
'emit'                               return 'EMIT'
'Init'                               return 'INITIAL_STATE'
'ByPass'                             return 'BY_PASS'

[a-zA-Z]\w*                          return 'IDENT'
'+'                                  return 'PLUS'
'{'                                  return 'LEFT_BRACE'
'}'                                  return 'RIGHT_BRACE'
'#'                                  return 'CONTEXT_SYMBOL'
'$'                                  return 'DOLLAR_SYMBOL'
','                                  return 'COMMA'
'('                                  return 'LEFT_BRACKET'
'<='                                 return 'LEFT_ARROW'
'=>'                                 return 'RIGHT_ARROW'
'='                                  return 'ASSIGN'
')'                                  return 'RIGHT_BRACKET' 
'/'                                  return 'FORWARD_SLASH'
\'[^']+\'                            yytext = yytext.slice(1,-1); return 'STRING'
\"[^"]+\"                            yytext = yytext.slice(1,-1); return 'STRING'
'-'?[0-9]+'.'[0-9]+                  return 'DECIMAL'
'-'?[0-9]+                           return 'INTEGER'

'[]'                                 return 'ARRAY'



/lex




%start start

%% /* language grammar */

/* $$ is the value of the symbol being evaluated (= what is to the left of the : in the rule */
start
        : document 'EOF' {return $1};

document
        : /* empty */ {$$={contextDescription:[],emit:[],subscribe:[],initialState:false,byPass:false}}
        | document line {
           if($2 !== '\n') {
              if($2.hasOwnProperty('initialState')){
                $1['initialState'] = true
              }
              if($2.hasOwnProperty('byPass')){
                $1['byPass'] = true
              }
              if($2.hasOwnProperty('context'))  $1['contextDescription'].push($2)
              if($2.hasOwnProperty('emit')) $1['emit'].push($2['emit'])
              if($2.hasOwnProperty('subscribe')) $1['subscribe'].push($2['subscribe'])
           }
        };
	
line
        : statements
        | 'NewLine';

statements
        :  PLUS INITIAL_STATE  {$$ = {initialState:true}}
        |  PLUS BY_PASS {$$ = {byPass:true}}
        |  CONTEXT_STATEMENT
        |  EMIT_STATEMENT
        |  SUBSCRIBE_STATEMENT;

CONTEXT_STATEMENT
        : CONTEXT_SYMBOL LEFT_BRACE RAW_KEYLIST RIGHT_BRACE {$$ = {context:$3} }
        | CONTEXT_SYMBOL LEFT_BRACE RAW_KEYLIST RIGHT_BRACE LEFT_ARROW KEY_LIST {
                  if($6.length > $3.length) {
                        throw new Error('The number of arguments must be equal to or less than the number of context arguments.')}; $$ = {context: $3, reducer:$6}};


EMIT_STATEMENT
        : EMIT_EVENT {$$ = {emit:{...$1}}}
        | EMIT_EVENT KEY_LIST_STATEMENT { $$ = {emit:{...$1, meta:[...$2]}} }
        | EMIT_EVENT KEY_LIST_STATEMENT LEFT_ARROW CONTEXT_SYMBOL LEFT_BRACE RAW_KEYLIST RIGHT_BRACE { $$ = {emit:{ ...$1, meta: $2, context:[...$6] }}};

EMIT_EVENT 
        : EMIT FORWARD_SLASH IDENT { $$ = {identifier:$3}};

SUBSCRIBE_STATEMENT
        : SUBSCRIBE_EVENT { $$ = {subscribe:$1}}
        | SUBSCRIBE_EVENT KEY_LIST_STATEMENT  { $$ = {subscribe:{payload:$2,...$1}}}
        | SUBSCRIBE_EVENT KEY_LIST_STATEMENT LEFT_ARROW KEY_LIST_STATEMENT  { $$ = {subscribe:{...$1,meta:$4, payload:$2}}};


SUBSCRIBE_EVENT
        : SUBSCRIBE FORWARD_SLASH IDENT IDENT { $$ = {identifier:$3, actionName:$4}};


KEY_LIST_STATEMENT
        : LEFT_BRACKET KEY_LIST RIGHT_BRACKET { $$ = $2};

KEY_LIST
        : KEY_ITEM {$$ = [$1]}
        | KEY_ITEM COMMA KEY_LIST {$$ = [$1].concat($3)};
KEY_ITEM
        : DATA_OBJECT {$$ = {keyItem:{...$1}}}
        | IMMUTABLE {$$ = {keyItem:{expression:$1}}}
        | FUNCTION {$$ = {keyItem:{expression:$1}}};

RAW_KEYLIST 
        : RAW_KEYITEM {$$ = [$1]}
        | RAW_KEYITEM COMMA RAW_KEYLIST {$$ =[$1].concat($3)};

RAW_KEYITEM 
        : IDENT {$$ = {keyItem:{identifier:$1}}}
        | IDENT ASSIGN EXPRESSION {$$ = {keyItem:{identifier: $1, expression: $3}}};

FUNCTION
        : FUNCTION_NAME LEFT_BRACKET ARGUMENTS RIGHT_BRACKET 
        {$$ = { expressionType:ExpressionTypes.Function,FunctionDeclaration: { FunctionName:$1, Arguments:[...$3]} } }
        | FUNCTION_NAME LEFT_BRACKET RIGHT_BRACKET 
        {$$ = { expressionType:ExpressionTypes.Function, FunctionDeclaration: { FunctionName:$1, Arguments:[] } } };

ARGUMENTS
        :  EXPRESSION {$$ = [$1]}
        |  ARGUMENTS COMMA EXPRESSION { $$ = [...$1, $3] };

DATA_OBJECT
        : DATA_OBJECT_REFERENCE ASSIGN  EXPRESSION  { $$ = {...$1, expression:$3}} 
        | DATA_OBJECT_REFERENCE;

EXPRESSION
        : IMMUTABLE
        | DATA_OBJECT_REFERENCE
        | FUNCTION;        

DATA_OBJECT_REFERENCE 
        : CONSTANT 
        | PAYLOAD_REFERENCE 
        | CONTEXT_REFERENCE;

CONSTANT 
        : CONSTANT_SYMBOL IDENT {$$ = {expressionType:ExpressionTypes.Constant, identifier:$2}};

PAYLOAD_REFERENCE
        : DOLLAR_SYMBOL IDENT  { $$ = {expressionType:ExpressionTypes.Payload, identifier: $2 } };

CONTEXT_REFERENCE
        : CONTEXT_SYMBOL IDENT  {$$ = {expressionType:ExpressionTypes.Context, identifier:$2 } };
        
IMMUTABLE
        : ARRAY {$$ = { ArrayDeclaration:[], expressionType:ExpressionTypes.ArrayDeclaration} } 
        | STRING {$$ = {StringDeclaration:$1.toString(), expressionType:ExpressionTypes.StringDeclaration}} 
        | NUMBER;

NUMBER
        : INTEGER 
        {$$ = { NumberDeclaration: Number($1), expressionType: ExpressionTypes.IntegerDeclaration} }
        | DECIMAL 
        {$$ = { NumberDeclaration: Number($1), expressionType:ExpressionTypes.DecimalDeclaration} };
%{
  /**
 * This constant holds a list of reserved words in the  parser.
 */
 const ReservedList = ['end note, +INITIAL'];
/**
 * This constant holds a list of special characters that are not allowed in yantrix expressions.
 */
 const SpecialCharList = [
    '!',
    '@',
    "$", // Нужны двойные кавычки, т.к при одинарных некорректно импортируется в грамматику
    '%',
    '^',
    '&',
    '*',
    '"',
    '№',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
    '+',
    '-',
    '=',
    ';',
    ':',
    '?',
    '.',
    ',',
    '/',
    '\\',
    '|',
];
/**
 * This object contains the different types of expressions that can be used in the parser.
 */
 const ExpressionTypes = {
    Function: 'function',
    StringDeclaration: 'string',
    ArrayDeclaration: 'array',
    Constant: 'constant',
    IntegerDeclaration: 'integer',
    DecimalDeclaration: 'decimal',
    FunctionProperty: 'FunctionProperty',
    Property: 'property',
};
//# sourceMappingURL=index.js.map
%}



%lex

%options case-insensitive
// Special states for recognizing aliases
%token note of statement
%x ContextStatement
%x ContextInitialValue

%x PayloadStatement
%x PayloadValue
%x  ActionStatement
%x EmitStatement
%x SubscribeStatement
%x Payload
%x Note
%s Func
%s Prop
%s ConstantState
%s KeyList
%s rightSideOperation
%s leftArrow
%%





<<EOF>>                              return 'EOF';
[\r\n]+                              return 'NewLine';
[\s]+                                /* skip all whitespace */
','                                  {return ','}
')'                                  {this.popState();return ')'}
'('                                  {return '('}
'=>'[\s]                             {this.popState();this.begin('ActionStatement'); return '=>'}
'<='[\s]                             {this.popState(); this.begin('KeyList');return '<=' }
'='                                  {return '='}
\'[^\n#{()=><""]+\'                 {yytext=yytext.slice(1,-1);return 'StringDeclaration';}
\"[^\n#{()=><'']+\"                  {yytext=yytext.slice(1,-1);return 'StringDeclaration';}

'subscribe/'                         {this.begin('SubscribeStatement'); return 'subscribe/'}
<SubscribeStatement>[^/=>\s]+        {this.popState(); return 'EventName'}

'}'                                  {this.popState();return '}'}

'-'?[0-9]+'.'[0-9]+                 {return 'decimalLiteral'}
'-'?[0-9]+                          {return 'integerLiteral'}

[A-Za-z]{1,}[A-Za-z0-9\.]+(?=[(])    {this.begin('Func');return 'FunctionName';}

'emit/'                               {this.begin('EmitStatement'); return 'emit/'}
<EmitStatement>[^()=<\n]+             {this.popState(); return 'EventName'}

'#{'                                  {this.begin('KeyList');return '#{'}
'{'                                   {this.begin('KeyList');return '{'}

'$('                   {this.begin('ConstantState'); return '$('}
<ConstantState>[A-Za-z_]+   { return 'Constant'}
<ConstantState>')'          {this.popState(); return ')'}

[a-zA-Z]\w+                  {return 'TargetProperty'}

<ActionStatement>[^\}\()>\s\n<=]+    {this.popState(); this.begin('KeyList');return 'ActionName'}

'[]'                   {return 'Array'}





/lex

%start start

%% /* language grammar */

/* $$ is the value of the symbol being evaluated (= what is to the left of the : in the rule */
start
	: document 'EOF' {return $1}
	;

document
	: /* empty */ {$$={contextDescription:[],emit:[],subscribe:[]}}
	| document line {
           if($2 !== '\n') {
              $1['contextDescription'].push($2)
              if($2.hasOwnProperty('eventName')) $1['emit'].push($2)
              if($2.hasOwnProperty('event')) $1['subscribe'].push($2)
           }
        }
	;
line
	: statements
	| 'NewLine'
	;
statements
        :  InitialState  {$$ = {initialState:true}}
        |  ContextDefinitions
        |  EventEmitStatement
        |  SubscribeStatement
        ;

ContextDefinitions
        : ContextStatement {$$ = {context:$1}}
        | ContextStatement '<=' '(' KeyList')' {if($4.length > $1.length){
throw new Error(`The number of payload arguments must be equal to or less than the context argument`);}$$ = {context:$1, payload:$4}}
        | ContextStatement '<=' '{' KeyList '}' {if($4.length > $1.length) {throw new Error('The number of arguments in the previous context must be equal to or less than the number of arguments specified in the current context.')}$$ = {context:$1, prevContext:$4}}
        ;
ContextStatement
        : '#{' KeyList'}'  } {$$ = $2};
EventEmitStatement
        : 'emit/' EventName  {$$ =  { eventName:$2}}
        | 'emit/' EventName '<=' '(' KeyList  ')' {$$ = {
         eventName:$2,
         payload: $5
         }}
        ;
SubscribeStatement
       : 'subscribe/'  EventName  '=>' ActionStatement { $$ =  {
          event:$2,
          action: $4
       }
      }
       ;
ActionStatement
       : ActionName { $$ =  {actionName:$1}} }
       | ActionName '(' KeyList  ')' {$$ = {
    actionName:$1,
    payload:$3
}}} ;

KeyList  : KeyItem {$$ = [$1]; } | KeyList ',' KeyItem {$1.push($3)};
KeyItem  : TargetProperty '=' Expression
            {
                if ($3.hasOwnProperty('Property')) {
                    if ($3['Property'] === $1) {
                        throw new Error('The property cannot match the target property');
                    }
                }
                $$ = {
                    KeyItemDeclaration: {
                        TargetProperty: $1,
                        Expression: $3
                    }
                };
            }
         | TargetProperty
            {
                $$ = {
                    KeyItemDeclaration: {
                        TargetProperty: $1.toLowerCase()
                    }
                };
            };

Expression
          : FunctionOperator {$$ = {...$1, expressionType:ExpressionTypes.Function}}
          | TargetProperty {$$ = {Property:$1, expressionType:ExpressionTypes.Property}}
          | StringDeclaration {$$ = {StringDeclaration:$1.toString(), expressionType:ExpressionTypes.StringDeclaration}}
          | ConstantDeclaration {$$ = {ConstantReference:$1, expressionType:ExpressionTypes.Constant}}
          | Array {$$ = {ArrayDeclaration:[], expressionType:ExpressionTypes.ArrayDeclaration}}
          | Number
          ;

Number
        : integerLiteral {$$ = {NumberDeclaration: Number($1), expressionType:ExpressionTypes.IntegerDeclaration}}
        | decimalLiteral {$$ = {NumberDeclaration: Number($1)}}
        ;

FunctionOperator
        : FunctionName '(' ArgumentsTypes ')' {$$={FunctionDeclaration:{FunctionName:$1, Arguments:[...$3]}}}
        | FunctionName '(' ')' {$$ = {FunctionDeclaration:{FunctionName: $1, Arguments: []}}}
        ;


ArgumentsTypes
             |  Expression {$$=[$1]}
             |  ArgumentsTypes ',' Expression {$$ = [...$1, ...$3]}
             ;

ConstantDeclaration : '$(' Constant ')'{ $$ = $2};

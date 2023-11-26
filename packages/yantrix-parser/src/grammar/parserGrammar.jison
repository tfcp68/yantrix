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
%x SubcribeStatement
%x Payload
%x Note
%s Func
%s Prop
%s Constant
%s KeyList
%s operandRight
%s leftArrow
%%





<<EOF>>                              return 'EOF';
[\r\n]+                              return 'NewLine';
[\s]+                                /* skip all whitespace */
'+INITIAL'                           return 'InitialState';
'note'                               {return 'note'}
'left'                               {return 'left'}
'right'                              {return 'right'}
'end'                                {return 'end'}
\'[^\n#{()=><"]+\'        {return 'StringDeclaration'}
'of'\s                                 {this.begin('Note'); return 'of'}
<Note>[^\n#{()=><]+                  {this.popState(); return 'StateID'}
'=>'[\s]                             {this.begin('ActionStatement'); return '=>'}
'#{'                                 {this.begin('KeyList');return '#{'}
<KeyList>[^()=][A-Za-z]+   {return 'TargetProperty'}   
<KeyList>','                         {return ','}
<KeyList>'='                          {this.begin('operandRight'); return '='}
<KeyList,operandRight>[A-Za-z]{1,}[A-Za-z0-9\.]+(?=[(])                                                              {this.begin('Func');return 'FunctionName';}
'}'                                  {this.popState();return '}'}
<ActionStatement>[^\}\()>\s\n<=]+    {this.popState(); this.begin('KeyList');return 'ActionName'}
'subscribe/'                         {this.begin('SubcribeStatement'); return 'subscribe/'}
<SubcribeStatement>[^/=>\s]+         {this.popState(); return 'EventName'}

'<='[\s]                             {this.begin('leftArrow');return '<=' }
<leftArrow>'('                       {this.begin('KeyList');return'('}

'emit/'                              {this.begin('EmitStatement'); return 'emit/'}  
<EmitStatement>[^()=<\n]+            {this.popState(); return 'EventName'}



[0-9]+'.'[0-9]+        {return 'decimalLiteral'}
[0-9]+        {return 'integerLiteral'}
'$('    {this.begin('Constant'); return '$('}
<Constant>[A-Za-z_]+ { return 'ConstantReference'} 
<Constant>')'         {this.popState(); return ')'} 
'[]'                   {return 'Array'}
'('                    {return '('}
','                    {return ','}
')'                {return ')'}

[A-Za-z]{1,}[A-Za-z0-9\.]+(?=[(])                                                              {this.begin('Func');return 'FunctionName';}
<Func>[A-Za-z_]+         {this.popState();return 'PropertyArgument'}           
<operandRight>[^}($\n,)]+    {this.popState(); return 'Property'}
'='                    {this.begin('operandRight');return '='}
\s+                   /* skip whitespace */
\'[^\n#{()=><"]+\'        {return 'StringDeclaration'}
[A-Za-z]{1,}[A-Za-z0-9\.]+(?=[(])                                                              {this.begin('Func');return 'FunctionName';}
<<EOF>>               return 'EOF'







/lex

%start start

%% /* language grammar */

/* $$ is the value of the symbol being evaluated (= what is to the left of the : in the rule */
start
	: notesDocument 'EOF' {return $1}
	;


notesDocument
	: /* empty */ {$$ = []}
	| notesDocument noteLine {
            if($2 !== '\n') $$.push($2)
        }
	;

noteLine  
        : NewLine 
        | Note 
        ;

Note    : 'note' direction 'of' StateID document 'end' 'note' {;$$ = {state:$4,description:$5}}  ;
direction : left | right;

document
	: /* empty */ {$$={contextDescription:[],emit:[],subscribe:[]}}
	| document line {
           if($2 !== '\n') {
              if($2.hasOwnProperty('context')) $1['contextDescription'].push($2)
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
        |  ContextDefenitions  
        |  EventEmitStatement 
        |  SubcribeStatement 
        ;
                
ContextDefenitions
        : ContextStatement {$$ = {...$1}}
        | ContextStatement '<=' '(' KeyList')' {$$ = {...$1,...$4}}
        ; 
ContextStatement
        : '#{' KeyList'}' {$$ = { context: $2} }
        | '#{' KeyList'=' KeyList'}' {
console.log($4)
$$ = {
 context:$2,
 initialValue:$4
}}
        ;
EventEmitStatement
        : 'emit/' EventName  {$$ =  { eventName:$2}}
        | 'emit/' EventName '<=' '(' KeyList  ')' {$$ = {
         eventName:$2,
         payload: $5
         }}
        ;
SubcribeStatement
       : 'subscribe/'  EventName  '=>' ActionStatement { $$ =  {
          event:$2,
          action: $4
       }
      }
       ;
ActionStatement
       : ActionName { $$ = {actionName:$1}}
       | ActionName '(' KeyList  ')' {$$ = {actionWithPayload: {
    actionName:$1,
    payload:$3
}}} ;

KeyList  : KeyList | KeyItem ',' KeyList | KeyItem ;
KeyItem  : TargetProperty '=' Expression {$$ = {KeyItemDeclaration: {
TargetProperty:$1, Expression:$3}}} | TargetProperty {$$={KeyItemDeclaration:{TargetProperty:$1}}};
Expression 
          : FunctionOperator {console.log($$)}
          | Property {$$ = {Property:$1}}
          | StringDeclaration {$$ = {StringDeclaration:$1}}
          | Array {$$ = {ArrayDeclaration:$1}}
          | Constant
          ;
FunctionOperator 
      : FunctionName '(' ')'  {$$ ={FunctionDeclaration:{FunctionName:$1,Arguments:[]}}}
      | FunctionName '(' Arguments ')' {$$={FunctionDeclaration:{FunctionName:$1, Arguemnts:[...$3]}}}
      ; 
Arguments 
        : /* empty */ {$$ = []} 
        | Ident {$$=[$1]}
        | FunctionOperator {$$=[$1]}
        | Arguments ',' Arguments {$$ = [...$1,...$3]}
        ;
Ident 
   : PropertyArgument {$$={FunctionProperty:$1}}
   | decimalLiteral {$$={decimalLiteral :$1}}
   | integerLiteral {$$={integerLiteral :$1}}
   | StringDeclaration  {$$={StringDeclaration:$1}}
   | Constant
   ;
Constant : '$(' ConstantReference ')';

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
%%





<<EOF>>                              return 'EOF';
[\r\n]+                              return 'NewLine';
[\s]+                                /* skip all whitespace */
'+INITIAL'                           return 'InitialState';
'note'                               {return 'note'}
'left'                               {return 'left'}
'right'                              {return 'right'}
'end'                                {return 'end'}
'of'\s                                 {this.begin('Note'); return 'of'}
<Note>[^\n#{()=><]+                  {this.popState(); return 'StateID'}
'=>'[\s]                             {this.begin('ActionStatement'); return '=>'}
<ActionStatement>[^\}\()>\s\n<=]+    {this.popState();return 'ActionName'}
'subscribe/'                         {this.begin('SubcribeStatement'); return 'subscribe/'}
<SubcribeStatement>[^/=>\s]+         {this.popState(); return 'EventName'}
'<='[\s]                             {return '<=' }
'=>'[\s]                             {return '=>' }
[^(][A-Za-z]+(?=[=,])      {this.begin('KeyList');return 'TargetProperty'}
'#{'                                 { return '#{'}           
'}'                                  {return '}'}

'emit/'                              {this.begin('EmitStatement'); return 'emit/'}  
<EmitStatement>[^()=<\n]+            {this.popState(); return 'EventName'}



[0-9]+'.'[0-9]+        {return 'decimalLiteral'}
[0-9]+        {return 'integerLiteral'}
'$('    {this.begin('Constant'); return '$('}
<Constant>[A-Za-z_]+ { return 'ConstantReference'} 
<Constant>')'         {this.popState(); return ')'} 
\'[^\n#{()=><"]+\'        {return 'StringDeclaration'}
'[]'                   {return 'Array'}
'('                    {return '('}
','                    {return ','}
')'                {return ')'}

[A-Za-z]{1,}[A-Za-z0-9\.]+(?=[(])                                                              {this.begin('Func');return 'FunctionName';}
<KeyList,Func>[A-Za-z_]+         {this.popState();return 'PropertyArgument'}           
<Prop>[^($\n,)]+    {this.popState(); return 'Property'}
'='                    {this.begin('Prop');return '='}
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

Note    : 'note' direction 'of' StateID document 'end' 'note' {console.log($5);$$ = {state:$4,description:$5}}  ;
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
        : ContextStatement 
        | ContextStatement '<=' '(' KeyList')' {$$ = {...$1,payload:$4}}
        ; 
ContextStatement
        : '#{' KeyList'}' {$$ = { context: $2} }
        | '#{' KeyList'=' KeyList'}' {$$ = {
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

expressions
    : KeyList EOF 
        {return $1;}
    ;

.
KeyList  : KeyList | KeyItem ',' KeyList | KeyItem  ;
KeyItem  : TargetProperty '=' Expression | TargetProperty;
Expression 
          : FunctionOperator 
          | Property
          | StringDeclaration
          | Array
          | Constant
          ;
FunctionOperator 
      : FunctionName '(' ')' 
      | FunctionName '(' Arguments ')' 
      ; 
Arguments 
        : FunctionOperator {console.log($$)}
        | Ident 
        | Arguments ',' Arguments
        ;
Ident 
   : PropertyArgument 
   | decimalLiteral 
   | integerLiteral 
   | StringDeclaration
   | Constant
   ;
Constant : '$(' ConstantReference ')';
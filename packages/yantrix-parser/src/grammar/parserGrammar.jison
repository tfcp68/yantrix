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
%%

<<EOF>>                              return 'EOF';
[\r\n]+                              return 'NewLine';
[\s]+                                /* skip all whitespace */
'+INITIAL'                           return 'InitialState';
'note'                               {return 'note'}
'end'                                {return 'end'}
'of'\s                                 {this.begin('Note'); return 'of'}
<Note>[^\n#{()=><]+                  {this.popState(); return 'StateID'}
'('                                  {this.begin('PayloadValue'); return '('}
')'                                  {return ')'}
'<='[\s]                             {return '<=' }
<PayloadValue>[^\n#{()]+             {this.popState(); return 'PayloadName' }
'=>'[\s]                             {this.begin('ActionStatement'); return '=>'}
<ActionStatement>[^\}\()>\s\n<=]+    {this.popState();return 'ActionName'}

'#{'                                 {this.begin('ContextStatement'); return '#{'}
<ContextStatement>[^\}\n=]+          {return 'ContextProperty'};
<ContextStatement>[=]                {this.begin('ContextInitialValue'); return '='};
<ContextInitialValue>[^\}\n<=]+      {this.popState(); return 'ContextInitialValue'}
<ContextStatement>[}]                {this.popState(); return '}'}

'emit/'                              {this.begin('EmitStatement'); return 'emit/'}  
<EmitStatement>[^()=<\n]+            {this.popState(); return 'EventName'}

'subscribe/'                         {this.begin('SubcribeStatement'); return 'subscribe/'}
<SubcribeStatement>[^/=>\s]+         {this.popState(); return 'EventName'}

          

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

Note    : 'note' 'of' StateID document 'end' 'note' {$$ = {state:$3,description:$4}}  ;


document
	: /* empty */ {$$={contextDescription:[],emit:[],subscribe:[],initialState:false}}
	| document line {
           if($2 !== '\n') {
              if($2.hasOwnProperty('context')) $1['contextDescription'].push($2)
              if($2.hasOwnProperty('eventName')) $1['emit'].push($2)
              if($2.hasOwnProperty('event')) $1['subscribe'].push($2)
              if($2.hasOwnProperty('initialState')) $1['initialState']=true
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
        | ContextStatement '<=' '(' PayloadName ')' {$$ = {...$1,payload:$4}}
        ; 
ContextStatement
        : '#{' ContextProperty '}' {$$ = { context: $2} }
        | '#{' ContextProperty   '=' ContextInitialValue '}' {$$ = {
 context:$2,
 initialValue:$4
}}
        ;
EventEmitStatement
        : 'emit/' EventName  {$$ =  { eventName:$2}}
        | 'emit/' EventName '<=' '(' PayloadName ')' {$$ = {
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
       | ActionName '(' PayloadName ')' {$$ = {actionWithPayload: {
    actionName:$1,
    payload:$3
}}} ;

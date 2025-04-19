import { useRef, useState, useEffect, useCallback } from "react";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { registerMermaidLanguage } from "./registerMermaidLanguage";

`stateDiagram-v2
[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]`

const defaultDiagram = [
    '%% example diagram',
    'stateDiagram-v2',
    '\t[*] --> Still',
    '\tStill --> [*]',
    '\tStill --> Moving',
    '\tMoving --> Still',
    '\tMoving --> Crash',
    '\tCrash --> [*]'
]

export const Editor = ({ onChange: updateEditorText }) => {
    const [editor, setEditor] = useState(null);
    const monacoEl = useRef(null);

    useEffect(() => {
        if (monacoEl) {
            setEditor((editor) => {
                if (editor) return editor;
                
                registerMermaidLanguage(monaco);
                const monacoEditor = monaco.editor.create(monacoEl.current, {
                    theme: 'mermaid-dark',
                    value: defaultDiagram.join('\n'),
                    language: 'mermaid',
                    minimap: {
                        enabled: false
                    },
                    acceptSuggestionOnCommitCharacter: false,
                    acceptSuggestionOnEnter: false,
                    automaticLayout: true,
                    bracketPairColorization: {
                        enabled: false
                    },
                    colorDecorators: true,
                    codeLens: false,
                    contextmenu: false,
                    inlayHints: {
                        enabled: false
                    },
                    inlineSuggest: {
                        enabled: false
                    },
                    lightbulb: {
                        enabled: false
                    },
                    parameterHints: {
                        enabled: false
                    },
                    quickSuggestions: false,
                    suggest: {
                        enabled: false,
                        preview: false,
                        selectionMode: 'never',
                        shareSuggestSelections: false
                    },
                    scrollbar: {
                        
                    },
                    stickyScroll: {
                        enabled: false
                    }
                });
                
                monacoEditor.onDidChangeModelContent(e => {
                    const value = monacoEditor.getValue();
                    updateEditorText(value);
                });

                updateEditorText(monacoEditor.getValue());

                return monacoEditor;
            });
        }

        return () => editor?.dispose();
    }, [monacoEl.current]);

    return <div className='monaco-editor grow' ref={monacoEl}></div>

}

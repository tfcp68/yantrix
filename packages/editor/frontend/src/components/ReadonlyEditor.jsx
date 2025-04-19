import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useState, useRef, useEffect } from 'react';

export const ReadonlyEditor = ({ text, language }) => {

    const [editor, setEditor] = useState(null);
    const monacoEl = useRef(null);

    useEffect(() => {
        if (monacoEl) {
            setEditor((editor) => {
                if (editor) return editor;
                
                const monacoEditor = monaco.editor.create(monacoEl.current, {
                    theme: 'mermaid-dark',
                    value: text,
                    readOnly: true,
                    language: language,
                    minimap: {
                        enabled: false
                    },
                    automaticLayout: true,
                    colorDecorators: true,
                    stickyScroll: {
                        enabled: false
                    }
                });

                return monacoEditor;
            });
        }

        return () => editor?.dispose();
    }, [monacoEl.current]);

    useEffect(() => {
        if (editor) {
            editor.setValue(text);
            monaco.editor.setModelLanguage(editor.getModel(), language ?? '');  
        }
    }, [text, language])

    return <div className='monaco-editor outline-none grow h-full w-full' ref={monacoEl}></div>
}

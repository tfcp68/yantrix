import { EditorOptions } from "../components/EditorOptions";
import { useEffect, useState } from "react"
import { Editor } from "../components/Editor"
import { AutomataView } from "./AutomataView";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/ui/resizable";

export const MainView = () => {

    const [editorText, setEditorText] = useState('');
    const [diagramText, setDiagramText] = useState('');
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
    const [editorIsActive, setEditorIsActive] = useState(false);

    const toggleAutoSync = () => {
        setAutoSyncEnabled(prev => !prev);
    }

    const toggleEditorIsActive = () => {
        setEditorIsActive(prev => !prev);
    }

    const updateDiagramText = () => {
        setDiagramText(editorText);
    }

    useEffect(() => {
        let activeTimeoutID = 0;
        if (autoSyncEnabled) {
            activeTimeoutID = setTimeout(() => updateDiagramText(), 1000);
        }

        return () => clearTimeout(activeTimeoutID);
    }, [editorText, autoSyncEnabled]);

    return <ResizablePanelGroup direction="horizontal" className="view w-full h-full flex bg-dark">
        <ResizablePanel defaultSize={25} id="monaco-editor-container" className={editorIsActive ? "flex flex-col h-full" : 'hidden'}>
            <EditorOptions autoSyncEnabled={autoSyncEnabled} onAutoSyncToggle={toggleAutoSync} triggerUpdate={updateDiagramText} />
            <Editor autoSyncEnabled={autoSyncEnabled} onChange={setEditorText} />
        </ResizablePanel>
        <ResizableHandle withHandle className={`bg-black opacity-20 hover:opacity-80 transition z-10 ${editorIsActive ? '' : 'hidden'}`} />
        <ResizablePanel>
            <AutomataView diagramText={diagramText} editorIsActive={editorIsActive} toggleEditor={toggleEditorIsActive} />
        </ResizablePanel>
    </ResizablePanelGroup>
}
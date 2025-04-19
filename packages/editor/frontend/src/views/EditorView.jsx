import { Editor } from "../components/Editor"
import { EditorOptions } from "../components/EditorOptions"

export const EditorView = ({ autoSyncEnabled, toggleAutoSync, updateDiagramText, setEditorText }) => {
    
    return (
        <div id="monaco-editor-container" className="flex flex-col w-1/5 h-full">
            <EditorOptions autoSyncEnabled={autoSyncEnabled} onAutoSyncToggle={toggleAutoSync} triggerUpdate={updateDiagramText} />
            <Editor autoSyncEnabled={autoSyncEnabled} onChange={setEditorText} />
        </div>
    )
}
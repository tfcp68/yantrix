import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export const EditorOptions = ({ autoSyncEnabled, onAutoSyncToggle, triggerUpdate }) => {

    return <div id="monaco-editor-options-panel" className="p-2 flex flex-wrap gap-3 justify-end bg-mermaid">
        <div className="autosync flex items-center gap-3 ">
            <Label htmlFor="autosync" className="text-xs text-white">Auto sync</Label>
            <Switch id="autosync" onClick={onAutoSyncToggle} checked={autoSyncEnabled} />
        </div>
        <Button
            variant='outline'
            size='sm'
            className="text-xs select-none"
            disabled={autoSyncEnabled}
            onClick={triggerUpdate}
        >Update</Button>
    </div>

}
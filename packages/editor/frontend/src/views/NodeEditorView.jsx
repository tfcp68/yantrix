import { NodeEditor } from '../components/node-editor/NodeEditor';
import {
    ReactFlowProvider
} from '@xyflow/react';

import { DnDProvider } from '../context/DnDContext';


export const NodeEditorView = () => {
    return (
        <ReactFlowProvider>
            <DnDProvider>
                <NodeEditor />
            </DnDProvider>
        </ReactFlowProvider>
    )
}

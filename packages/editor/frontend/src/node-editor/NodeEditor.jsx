import {
    ReactFlow,
    useReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    MiniMap,
    Controls,
    Background,
    Panel,
    useOnSelectionChange,
    MarkerType
} from '@xyflow/react';
  
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddNodePanel } from './AddNodePanel';
import { NodeDataTable } from './NodeDataTable';
import { EdgeDataTable } from './EdgeDataTable';

import { useDnD } from '../context/DnDContext';

// import { initialNodes, initialEdges } from './examples';
import nodeTypes from './nodes/types';
import edgeTypes from './edges/types';
import { data } from 'autoprefixer';

const initialNodes = [
    { id: 'test-state-1', type: 'state', position: { x: 700, y: 300 }, data: { name: 'New State', bypass: false, initial: false, editModeEnabled: false } },
];
const initialEdges = [];

let state_id = 10;
let edge_id = 10;
const getStateId = () => `state_${state_id++}`;
const getEdgeId = () => `edge_${edge_id++}`;

const createNewNode = (type, position, name) => { 
    return {
        id: getStateId(),
        type,
        position,
        data: { 
            name,
            bypass: false,
            initial: false,
            editModeEnabled: false
         },
        selected: true,
    }
}

export const NodeEditor = () => {

    const reactFlowWrapper = useRef(null);
    const [type] = useDnD();
    
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition } = useReactFlow();

    const [selectedNode, setSelectedNode] = useState(undefined);
    const [selectedEdge, setSelectedEdge] = useState(undefined);

    console.log('selected node: ', selectedNode);

    const removeEdgeHandler = (edge) => {
        console.log('deleting edge: ', edge);
        setEdges((edges) => edges.filter((e) => e.id !== edge.id));
        setSelectedEdge(undefined);
    }

    const removeNodeHandler = (node) => {
        console.log('deleting node: ', node);
        setNodes((nodes) => nodes.filter((n) => n.id !== node.id));
        setSelectedNode(undefined);
    }

    const onConnect = useCallback(
        (connection) => {
            const edge = { ...connection, selected: true, markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }, type: 'action' };
            console.log('edge: ', edge);
            setEdges((edges) => addEdge(edge, edges));
            setSelectedEdge(edge);
        },
        [setEdges],
    );

    // to add new nodes from after drawing edge from other nodes
    const onConnectEnd = useCallback(
        (event, connectionState) => {
            console.log('connection state: ', connectionState);
            if (!connectionState.isValid) {
                const id = getStateId();
                const { clientX, clientY } =
                    'changedTouches' in event ? event.changedTouches[0] : event;
                const newNode = {
                    id,
                    type: 'state',
                    position: screenToFlowPosition({
                        x: clientX,
                        y: clientY,
                    }),
                    selected: true,
                    data: { name: 'New State' },
                    origin: [0.5, 0.0],
                };
                const newEdgeId = getEdgeId();
                setNodes((nds) => nds.concat(newNode));
                setEdges((eds) =>
                    eds.concat({ 
                        id: newEdgeId,
                        source: connectionState.fromHandle.type === 'target' ? id : connectionState.fromNode.id,
                        target: connectionState.fromHandle.type === 'target' ? connectionState.fromNode.id : id,
                        type: 'action',
                        name: 'New Action',
                        // selected: true,
                        markerEnd: { type: MarkerType.Arrow }
                     }),
                );
                // setSelectedNode(newNode);
            }
        }
    )

    // capture selection of nodes or edges to open corresponding panel
    const onChange = useCallback(({ nodes, edges }) => {
        console.log('on change activated, ', nodes);
        setSelectedNode(nodes?.[0]);
        setSelectedEdge(edges?.[0]);
    }, []);
    useOnSelectionChange({ onChange });

    // add event listener to 'delete' key to remove selected node or edge
    useEffect(() => {
        const handleKeyDown = (event) => {
            console.log('key down: ', event.key);
            if (event.key === 'Delete') {
                if (selectedNode && !selectedNode.data.editModeEnabled) {
                    console.log('deleting selected node');
                    removeNodeHandler(selectedNode);
                } else if (selectedEdge) {
                    console.log('deleting selected edge');
                    removeEdgeHandler(selectedEdge);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNode, selectedEdge]);


    // when updating some nodes, refresh selected ones
    useEffect(() => {
        console.log('nodes in use effect: ', nodes);
        if (selectedNode) {
            // console.log('selected node! ', selectedNode);
            const node = nodes.find((node) => node.id === selectedNode.id);
            setSelectedNode({
                ...node,
                selected: true
            });
        }
    }, [nodes]);

    // same for edges
    useEffect(() => {
        if (selectedEdge) {
            setSelectedEdge(edges.find((edge) => edge.id === selectedEdge.id));
        }
    }, [edges]);

    // useEffect for adding new node outlines that follow your mouse
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [ghostNodeOutline, setGhostNodeOutline] = useState(null);
    // useEffect(() => {
        
    //     const mouseMoveHandler = (event) => {
    //         console.log('mouse move: ', event.clientX, event.clientY);
    //         if (ghostNodeOutline) {
    //             setMousePos({ x: event.clientX, y: event.clientY });
    //         }
    //     };
    //     const mouseClickHandler = () => {
    //         if (ghostNodeOutline) {
                
    //             // add new node to the editor
    //             const newNode = {
    //                 id: getId(),
    //                 type: ghostNodeOutline.type,
    //                 selected: true,
    //                 position: screenToFlowPosition(mousePos),
    //                 data: { label: `Node ${id}` },
    //             };
    //             setNodes((nds) => nds.concat(newNode));
    //             setSelectedNode(newNode);

    //             setGhostNodeOutline(null); // remove outline
    //         }
    //     }
        
    //     window.addEventListener('mousemove', mouseMoveHandler);

    //     if (ghostNodeOutline) {
    //         // window.addEventListener('click', mouseClickHandler);
    //     }

    //     return () => {
    //         window.removeEventListener('mousemove', mouseMoveHandler);
    //         window.removeEventListener('click', mouseClickHandler);
    //     }

    // }, [ghostNodeOutline])

    // DnD events
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }, []);
     
    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
        
            // check if the dropped element is valid
            if (!type) {
            return;
            }
        
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode = createNewNode(type, position, 'New State');
        
            setNodes((nds) => nds.concat(newNode));
            setType(null);
        },
        [screenToFlowPosition, type],
    );

    return (
        <div className="dndflow w-full h-full">
            <div className="reactflow-wrapper w-full h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    // connectionMode="loose"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onConnectEnd={onConnectEnd}
                    defaultEdgeOptions={{ animated: true }}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Panel position="bottom-center">
                        <AddNodePanel onNodeSelect={setGhostNodeOutline} />
                    </Panel>
                    <Panel position='top-left' className="flex flex-col gap-5">
                        {selectedNode && (
                            <NodeDataTable node={selectedNode} onDelete={() => removeNodeHandler(selectedNode)} />
                        )}
                        {selectedEdge && (
                            <EdgeDataTable edge={selectedEdge} onDelete={() => removeEdgeHandler(selectedEdge)} />
                        )}
                    </Panel>
                    <Background variant="cross" color='#474747' />

                    {/* {ghostNodeOutline && (
                        <StateNode outline style={{
                            left: mousePos.x-80,
                            top: mousePos.y-75,
                            opacity: 0.5,
                            position: "absolute",
                            pointerEvents: "none",
                            cursor: 'pointer',
                        }} />
                    )} */}
                </ReactFlow>
            </div>
        </div>
    )
}
import { useNodeConnections, useReactFlow, useNodes, useEdges } from "@xyflow/react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCaption, TableRow, TableCell } from "../ui/table"
import { useState } from "react";

const transformNodeConnectionData = (node, connections, nodes, edges) => {
    
    const transformedConnections = { source: [], target: [] };
    
    for (const sourceConnection of connections.source) {
        const { edgeId, target: targetNodeId } = sourceConnection;
        
        // find edge data
        const edge = edges.find((edge) => edge.id === edgeId);

        // find target node data
        const targetNode = nodes.find((node) => node.id === targetNodeId);

        transformedConnections.source.push({
            sourceNode: node,
            targetNode: targetNode,
            edge: edge
        });
    }

    for (const targetConnection of connections.target) {
        const { edgeId, source: sourceNodeId } = targetConnection;
        
        const edge = edges.find((edge) => edge.id === edgeId);
        const sourceNode = nodes.find((node) => node.id === sourceNodeId);

        transformedConnections.target.push({
            sourceNode: sourceNode,
            targetNode: node,
            edge: edge
        });
    }

    return transformedConnections;
}

export const NodeDataTable = ({ node, onDelete:deleteNode }) => {
    const { id, type = '-unknown-', data } = node;
    // console.log('node: ', node);

    const { setNodes } = useReactFlow();

    const [nameEditEnabled, setNameEditEnabled] = useState(false);

    // show connections in a separate tab
    const nodeConnections = transformNodeConnectionData(
        node,
        { 
            source: useNodeConnections({
                id: id,
                handleType: 'source',
            }),
            target: useNodeConnections({
                id: id,
                handleType: 'target'
            })
        },
        useNodes(),
        useEdges()
    )
    // console.log('connections for Node ', id, ': ', nodeConnections);

    const toggleByPass = () => {
        setNodes((nds) =>
            nds.map((node) => {
              if (node.id === id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    bypass: !node.data.bypass
                  },
                };
              }
       
              return node;
            }),
        );
    }

    // when node is set as initial, +Init flags in other nodes need to be disabled
    const setNodeAsInitial = () => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                        ...node.data,
                        initial: !node.data.initial
                        },
                    };
                }
                else {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            initial: false
                        }
                    }
                }
            }),
        );
    }

    const [name, setName] = useState(data?.name || '????');
    const confirmNameChange = () => {
        setNameEditEnabled(false);
        if (!name) {
            setName('[blank state]')
        }

        // update node data
        setNodes((nodes) => (
            nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            name: name
                        }
                    }
                }
                return node;
            })
        ));
    }
    const cancelNameChange = () => {
        setNameEditEnabled(false);
        setName(data?.name || '????');
    }
    const nameChangeInput = (
        <div className="change-name p-3">
            <p>Enter new node name: </p>
            <input type="text" className="text-black" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={() => confirmNameChange()}>+ Confirm</Button>
            <Button variant="destructive" onClick={() => cancelNameChange()}>x Cancel</Button>
        </div>
    )
    
    const table = (
        <Table className="w-80">
                <TableCaption>
                    <p>Actions: </p>
                    <div className="flex flex-col gap-1">
                        {type === 'state' && <Button variant='secondary' onClick={() => setNameEditEnabled(true)}>Rename Node</Button>}
                        <Button variant='destructive' onClick={() => deleteNode()}>Delete Node</Button>
                    </div>
                </TableCaption>
                <TableBody>
                    <TableRow>
                        <TableCell className="text-left text-gray-400 font-bold">Node ID</TableCell>
                        <TableCell className="text-right">{id}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-left text-gray-400 font-bold">Type of node</TableCell>
                        <TableCell className="text-right">{type}</TableCell>
                    </TableRow>
                    
                    {type === 'state' && (
                    <>
                        <TableRow>
                            <TableCell className="text-left text-gray-400 font-bold">State Name</TableCell>
                            <TableCell className="text-right">{data?.name || '????'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-left text-gray-400 font-bold">ByPass</TableCell>
                            <TableCell className="text-right">
                                {data.bypass ? (
                                    <Button variant='destructive' onClick={() => toggleByPass()}>Disable</Button>
                                ) : (
                                    <Button onClick={() => toggleByPass()} className='bg-blue-600 text-white'>Enable</Button>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-left text-gray-400 font-bold">Initial Node</TableCell>
                            <TableCell className="text-right flex gap-2 justify-end">
                                {data.initial ? (
                                    <Button variant='destructive' onClick={() => setNodeAsInitial()}>Disable</Button>
                                ) : (
                                    <Button onClick={() => setNodeAsInitial()} className='bg-blue-600 text-white'>Enable</Button>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell className="flex justify-end">
                                {data.initial && <Button variant='ghost' type="button">✔️ Set as initial</Button>}
                            </TableCell>
                        </TableRow>
                    </>
                    )}
                </TableBody>
            </Table>
    )

    return (
        <div className="bg-black text-white border-silver border rounded-xl p-2">
            {nameEditEnabled ? nameChangeInput : table}
        </div>
    )
}
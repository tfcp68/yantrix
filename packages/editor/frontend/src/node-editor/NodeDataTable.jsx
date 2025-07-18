import { useNodeConnections, useReactFlow, useNodes, useEdges } from "@xyflow/react";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCaption, TableRow, TableCell, TableHeader, TableHead } from "../components/ui/table"
import { useRef, useState, forwardRef } from "react";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { StateDirectivePanel } from "./StateDirectivePanel";
import { FaEye, FaTrash } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";

const Tabs = {
    INFO: 'Info',
    DIRECTIVES: 'Directives',
    CUSTOMIZE: 'Customize',
}

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

export const NodeDataTable = ({ node, openOnTab = Tabs.INFO, onDelete: deleteNode }) => {
    

    const { id, type = '-unknown-', data } = node;

    console.log('node data table render')
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

    const [stateDirectiveStringViews, setStateDirectiveStringViews] = useState(
        node.data.directives.map(directive => directive.id).reduce((acc, id) => ({ ...acc, [id]: false }), {})
    );
    console.log('stateDirectiveStringViews: ', stateDirectiveStringViews);

    const toggleDirectiveStringView = (directiveId) => {
        setStateDirectiveStringViews(prev => ({
            ...prev,
            [directiveId]: !prev[directiveId]
        }))
    }

    const [directiveToEdit, setDirectiveToEdit] = useState(null);

    const addNewDirective = (directive) => {
        console.log('adding new directive: ', directive);
        setNodes(nodes => {
            return nodes.map(node => {
                if (node.id === id) {
                    if (directive.id) { // already exists
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                directives: node.data.directives.map(d =>
                                    d.id === directive.id ? { ...directive } : d
                                )
                            }
                        }
                    }
                    else {
                        directive.id = `${id}-directive-${directive.type}-${node.data.directives.length + 1}`;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                directives: [...(node.data.directives || []), directive]
                            }
                        }
                    }
                    
                }
                return node;
            });
        });

        setDirectiveToEdit(null);
    }

    const viewDirective = (directive) => { }
    const editDirective = (directive) => { setDirectiveToEdit(directive); }

    const deleteDirective = (directive) => {
        setNodes(nodes => {
            return nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            directives: node.data.directives.filter(d => d.id !== directive.id)
                        }
                    }
                }
                return node;
            });
        });
    }

    const clearAllDirectives = () => { 
        setNodes(nodes => {
            return nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            bypass: false,
                            initial: false,
                            directives: []
                        }
                    }
                }
                return node;
            });
        });
    }

    const InfoTab = () => (
        <Table className="w-full">
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

    const DirectivesTab = () => (
        (directiveToEdit !== null) ? <StateDirectivePanel directive={ directiveToEdit } onCancel={() => setDirectiveToEdit(null)} onSave={addNewDirective}/> : (
            <div className="directives">
                <Table className="w-full">
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-left text-gray-400 font-bold">Initial Node</TableCell>
                            <TableCell className="text-right flex gap-2 justify-end">
                                {data.initial ? (
                                    <Button className="bg-green-500 hover:bg-red-700" onClick={() => setNodeAsInitial()}>This node is set as initial</Button>
                                ) : (
                                    <Button className="bg-blue-600 hover:bg-green-500 text-white" onClick={() => setNodeAsInitial()}>Set as initial</Button>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-left text-gray-400 font-bold">ByPass</TableCell>
                            <TableCell className="text-right">
                                {data.bypass ? (
                                    <Button className="bg-green-500 hover:bg-red-700" onClick={() => toggleByPass()}>ByPass enabled</Button>
                                ) : (
                                    <Button className="bg-blue-600 hover:bg-green-500 text-white" onClick={() => toggleByPass()}>Enable</Button>
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow></TableRow>
                    </TableBody>
                </Table>
                <h1 className="mt-5 mb-3 text-center text-base">Custom Directives</h1>
                {
                    node.data.directives.length === 0
                        ? <p className="text-center text-gray-500 text-sm"><i>--- empty ---</i></p>
                        : (
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            Directive
                                        </TableHead>
                                        <TableHead>
                                            Info
                                        </TableHead>
                                        <TableHead>
                                            Source variables
                                        </TableHead>
                                        <TableHead>
                                            Input variables
                                        </TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {node.data.directives.map((directive, idx) => (
                                        <TableRow key={directive.id || idx}>
                                            { 
                                                stateDirectiveStringViews[directive.id]
                                                    ? (
                                                        <TableCell colSpan={4} className="text-left">
                                                            <div
                                                                className="bg-gray-700 text-white border rounded px-2 py-1 text-xs min-w-full"
                                                            >
                                                                { getDirectiveStringRepresentation(directive)}
                                                            </div>
                                                        </TableCell>
                                                    )
                                                    : (
                                                        <>
                                                        <TableCell className="text-left text-gray-400 font-bold">
                                                            {getDirectiveName(directive)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getDirectiveInfo(directive)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {directive.sourceVars ? directive.sourceVars.join(', ') : '---'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {directive.inputVars ? directive.inputVars.join(', ') : '---'}
                                                        </TableCell>
                                                        </>
                                                    )
                                            }
                                            
                                            <TableCell>
                                                <div className="flex justify-center items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => toggleDirectiveStringView(directive.id)}>
                                                        <FaEye fill="cyan"/>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => editDirective(directive)}>
                                                        <FaPencil fill="yellow"/>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteDirective(directive)}>
                                                        <FaTrash fill="red"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                }
            </div>
        )
        
    );

    const CustomizeTab = () => (
        <>
        
        </>
    )

    const TabsContents = {
        [Tabs.INFO]: <InfoTab />,
        [Tabs.DIRECTIVES]: <DirectivesTab />,
        [Tabs.CUSTOMIZE]: <CustomizeTab />
    }

    const [selectedTab, setSelectedTab] = useState(openOnTab);

    const tabs = (
        <div className="tabs w-full flex gap-1 text-white select-none">
            {Object.values(Tabs).map((tab) => (
                <div className={`
                    tab flex-grow text-center rounded-t-md text-sm 
                    px-4 ${selectedTab === tab ? 'mt-0.5' : 'mt-1.5'} 
                    ${selectedTab === tab ? 'bg-black' : 'bg-gray-800 hover:bg-gray-700'}
                    ${selectedTab === tab ? 'cursor-default' : 'cursor-pointer'} 
                    border border-x-silver-500 border-t-silver-500 border-b-black
                `}
                    onClick={() => setSelectedTab(tab)} key={tab}
                >
                    {tab}
                </div>
            ))}
        </div>
    )

    const actionButtons = {
        [Tabs.INFO]: (
            <div className="flex flex-col gap-1">
                {type === 'state' && <Button variant='secondary' onClick={() => setNameEditEnabled(true)}>Rename Node</Button>}
                <Button variant='destructive' onClick={() => deleteNode()}>Delete Node</Button>
            </div>
        ),
        [Tabs.DIRECTIVES]: (
            <div className="flex flex-col gap-1">
                {type === 'state' && <Button variant='secondary' onClick={() => setDirectiveToEdit({})}>Add New Directive</Button>}
                <Button variant='destructive' onClick={() => clearAllDirectives()}>Clear All Directives</Button>
            </div>
        ),
        [Tabs.CUSTOMIZE]: (
            <div className="flex flex-col gap-1">
                {type === 'state' && <Button variant='secondary' onClick={() => setNameEditEnabled(true)}>Rename Node3</Button>}
                <Button variant='destructive' onClick={() => deleteNode()}>Delete Node3</Button>
            </div>
        ),
    }

    return (
        <>
            {tabs}
            <div className="bg-black text-white border border-x-silver-500 border-b-silver-500 border-t-black rounded-b-xl p-2">

                {/* {nameEditEnabled ? nameChangeInput : table} */}
                
                { TabsContents[selectedTab] }

                <div className="actions mt-5">
                    { actionButtons[selectedTab] }
                </div>

            </div>
        </>
    )
}

const getDirectiveName = (directive) => {
    switch (directive.type) {
        case 'state-context':
            return 'State Context';
        case 'subscribe-event':
            return 'Subscribe to Event';
        case 'emit-event':
            return 'Emit Event';
        default:
            return directive;
    }
}

const getDirectiveInfo = (directive) => {
    switch (directive.type) {
        case 'state-context':
            return '---';
        case 'subscribe-event':
            return `Name: ${directive.event}\nAction: ${directive.action}`;
        case 'emit-event':
            return `Name: ${directive.event}`;
        default:
            return directive;
    }
}

const getDirectiveStringRepresentation = (directive) => { 
    return `#{ items, selectedIndex } <= sortBy($optionsList, 'id'), 0`;
}
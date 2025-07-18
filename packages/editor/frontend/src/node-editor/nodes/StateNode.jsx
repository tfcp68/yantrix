import { Button } from "../../components/ui/button";
import { Handle, Position, useNodeConnections, useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react"
import { FaClipboardList, FaPlus } from "react-icons/fa";

const Tabs = {
    INFO: 'Info',
    DIRECTIVES: 'Directives',
    CUSTOMIZE: 'Customize',
}

export const StateNode = ({ id, data = {name: 'New State', bypass: false, initial: false, editModeEnabled: false}, selected, outline, ...props }) => {

    const { setNodes } = useReactFlow();
    const [stateName, setStateName] = useState(data.name || '[blank state]');
    const [nameEditEnabled, setNameEditEnabled] = useState(false);

    const [optionsMenuOpen, setOptionsMenuOpen] = useState(true);

    const checkEnterOrEscapePress = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            updateName();
        }
    }

    const updateName = () => {
        toggleEditMode(false);
        if (!stateName) {
            setStateName('[blank state]')
        }

        // update node data
        setNodes((nodes) => (
            nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            name: stateName,
                            options: {
                                info: false,
                                directives: false,
                                customize: false,
                            }
                        }
                    }
                }
                return node;
            })
        ))
    }

    const toggleEditMode = (flag) => {
        setNodes((nodes) => (
            nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            editModeEnabled: flag || !node.data.editModeEnabled
                        }
                    }
                }
                return node;
            })
        ));
        setNameEditEnabled(flag || !nameEditEnabled);
    }

    const showOptionsMenu = !data.options.selectedTab;
    const enableOption = (option) => {
        setNodes((nodes) => (
            nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            options: {
                                selectedTab: option
                            }
                        }
                    }
                }
                return node;
            })
        ));
    }

    return (
        <>
            {selected && showOptionsMenu && (
                <div className="absolute bottom-[130%] w-full flex flex-col gap-1 justify-center items-center">
                    <Button
                        size="sm"
                        className="[&_svg]:size-2 h-6 w-full hover:bg-gray-800"
                        onClick={() => enableOption(Tabs.INFO)}
                    >
                        <FaClipboardList size={14} />
                        <span className="text-[0.5rem]">View Info</span>
                    </Button>
                    <Button
                        size="sm"
                        className="[&_svg]:size-2 h-6 w-full hover:bg-gray-800"
                        onClick={() => enableOption(Tabs.DIRECTIVES)}
                    >
                        <FaClipboardList size={14} />
                        <span className="text-[0.5rem]">View Directives</span>
                    </Button>
                    <Button
                        size="sm"
                        className="[&_svg]:size-2 h-6 w-full hover:bg-gray-800"
                        onClick={() => enableOption(Tabs.CUSTOMIZE)}
                    >
                        <FaClipboardList size={14} />
                        <span className="text-[0.5rem]">Customize</span>
                    </Button>
                </div>
            )}
            <div
                className={
                    `
                    text-white
                    border hover:border-blue-600
                    ${selected ? 'border-blue-600' : 'border-white'}
                    ${selected ? 'cursor-default' : 'cursor-pointer'}
                    ${selected ? 'bg-blue-950' : 'bg-black'}
                    min-w-40 max-w-80 min-h-[40px]
                    text-wrap p-2 pr-6 pl-6 rounded-sm
                    `
                }
                style={{ width: `${stateName.length * 12}px` }}
                onDoubleClick={() => toggleEditMode(true)}
                {...props}
                draggable={false}
            >
                {nameEditEnabled ? (
                    <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        onBlur={() => { updateName(); }}
                        onKeyDown={e => checkEnterOrEscapePress(e)}
                        autoFocus
                        maxLength={30}
                        className="w-full outline-none text-center text-white bg-black"
                    />
                ): (
                    <p className="state-name text-center">
                        {outline ? '' : data.name}
                    </p>
                )}
                <Handle type='target' id='a' position={Position.Top} isConnectable />
                <Handle type='source' id='b' position={Position.Bottom} isConnectable />
            </div>
        </>
    )
}
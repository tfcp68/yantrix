import { Handle, Position, useNodeConnections, useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react"

export const StateNode = ({ id, data = {name: 'New State', bypass: false, initial: false}, selected, outline, ...props }) => {

    const { setNodes } = useReactFlow();
    const [stateName, setStateName] = useState(data.name || '[blank state]');
    const [nameEditEnabled, setNameEditEnabled] = useState(false);

    const checkEnterOrEscapePress = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            updateName();
        }
    }

    const updateName = () => {
        setNameEditEnabled(false);
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
                            name: stateName
                        }
                    }
                }
                return node;
            })
        ))
    }

    return (
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
            onDoubleClick={() => setNameEditEnabled(true)}
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
    )
}
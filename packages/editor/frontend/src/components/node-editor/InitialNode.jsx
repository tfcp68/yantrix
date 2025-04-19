import { Handle, Position } from "@xyflow/react"

export const InitialNode = ({ selected }) => {
    return (
        <div className={`
            rounded-full p-3
            border hover:border-blue-600 
            ${selected ? 'border-blue-600' : 'border-white'}
            ${selected ? 'cursor-default' : 'cursor-pointer'}
            ${selected ? 'bg-blue-950' : 'bg-black'}
        `}>
            <span className="bg-transparent initial-node-name"></span>
            <Handle type='source' position={Position.Bottom} isConnectable/>
        </div>
    )
}
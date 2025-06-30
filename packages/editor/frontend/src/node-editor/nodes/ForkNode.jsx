import { Handle, Position } from "@xyflow/react"

export const ForkNode = ({ selected }) => {
    
    return (
        <div className={`
            border hover:border-blue-600
            ${selected ? 'border-blue-600' : 'border-white'}
            ${selected ? 'cursor-default' : 'cursor-pointer'}
            ${selected ? 'bg-blue-950' : 'bg-black'}
            p-4 rotate-45 
        `}>
            <Handle type='target' id='a' position={Position.Top} isConnectable style={{left: 0}} />
            <Handle type='source' id='b' position={Position.Bottom} isConnectable style={{left: '100%'}} />
        </div>
    )
}
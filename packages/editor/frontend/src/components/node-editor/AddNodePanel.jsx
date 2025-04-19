import { useState } from 'react';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { FaPlus } from "react-icons/fa";
import { useDnD } from '../../context/DnDContext';

export const AddNodePanel = ({ onNodeSelect:createNodeOutline }) => {

    const [open, setOpen] = useState(false);
    
    const [_, setType] = useDnD();

    const onDragStart = (e, nodeType) => {
        console.log('drag start!');
        setOpen(false);
        setType(nodeType);
        e.dataTransfer.effectAllowed = 'move';
    };

    const selectNodeHandler = (nodeType) => {
        if (!nodeType) throw new Error('Node type not specified');
        setOpen(false);
        createNodeOutline({ type: nodeType });
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button onClick={() => setOpen(!open)}>
                    <FaPlus />
                    Add Node
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-full bg-slate-800 border-dark">
                <div className="flex gap-2">
                    <Button onClick={() => selectNodeHandler('initial')} onDragStart={(e) => onDragStart(e, 'initial')} draggable>
                        Initial
                    </Button>
                    <Button onClick={() => selectNodeHandler('state')} onDragStart={(e) => onDragStart(e, 'state')} draggable>
                        State
                    </Button>
                    <Button onClick={() => selectNodeHandler('fork')} onDragStart={(e) => onDragStart(e, 'fork')} draggable>
                        Fork
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

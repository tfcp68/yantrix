import { useReactFlow } from "@xyflow/react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCaption, TableRow, TableCell } from "../ui/table"
import { useState } from "react";

export const EdgeDataTable = ({ edge, onDelete:deleteEdge }) => {
    const { id, source, target, data } = edge;
    const name = data.name || '[unknown]';
    const { setEdges } = useReactFlow();
    const [newName, setNewName] = useState(name);
    const [nameEditEnabled, setNameEditEnabled] = useState(false);

    const nameChangeInput = (
        <div className="change-name p-3">
            <p>Enter new action name: </p>
            <input type="text" className="text-black" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button onClick={() => confirmNameChange()}>+ Confirm</Button>
            <Button variant="destructive" onClick={() => cancelNameChange()}>x Cancel</Button>
        </div>
    )
    const confirmNameChange = () => {
        setNameEditEnabled(false);
        if (!name) {
            setNewName('[blank action]')
        }

        // update edge data
        setEdges((edges) => (
            edges.map(e => {
                console.log('edge: ', e);
                if (e.id === id) {
                    return {
                        ...e,
                        name: newName
                    }
                }
                return e;
            })
        ));
    }
    const cancelNameChange = () => {
        setNameEditEnabled(false);
        setNewName(name || '????');
    }

    const table = (
        <Table className="w-80">
            <TableCaption>
                <p>Actions: </p>
                <div className="actions flex flex-col gap-1">
                    <Button variant='secondary' onClick={() => setNameEditEnabled(true)}>Rename Action</Button>
                    <Button variant='destructive' onClick={() => deleteEdge()}>Delete Action</Button>
                </div>
            </TableCaption>
            <TableBody>
                <TableRow>
                    <TableCell className="text-left text-gray-400 font-bold">Edge ID</TableCell>
                    <TableCell className="text-right">{id}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-left text-gray-400 font-bold">Action Name</TableCell>
                    <TableCell className="text-right">{name}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-left text-gray-400 font-bold">Source</TableCell>
                    <TableCell className="text-right">{source}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-left text-gray-400 font-bold">Target</TableCell>
                    <TableCell className="text-right">{target}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )

        return (
            <div className="bg-black text-white border-silver border rounded-xl p-2">
                {nameEditEnabled ? nameChangeInput : table}
            </div>
        )
}
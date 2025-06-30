import { MarkerType } from "@xyflow/react";


export const initialNodes = [
    // { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    // { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
    { id: '3', type: 'state', position: { x: 700, y: 300 }, data: { name: 'New State', bypass: false, initial: false } },
    { id: '4', type: 'initial', position: { x: 700, y: 400 } },
    { id: '5', type: 'fork', position: { x: 700, y: 500 } },
    { id: 'example-initial', type: 'initial', position: { x: 300, y: 300 } },
    { id: 'example-state-off', type: 'state', position: { x: 230, y: 380 }, data: { name: 'Off', bypass: false, initial: false } },
    { id: 'example-state-red', type: 'state', position: { x: 230, y: 480 }, data: { name: 'Red', bypass: false, initial: false } },
    { id: 'example-state-redyellow', type: 'state', position: { x: 180, y: 580 }, data: { name: 'RedYellow', bypass: false, initial: false } },
    { id: 'example-state-green', type: 'state', position: { x: 180, y: 680 }, data: { name: 'Green', bypass: false, initial: false } },
    { id: 'example-state-yellow', type: 'state', position: { x: 230, y: 780 }, data: { name: 'Yellow', bypass: false, initial: false } },
];

export const initialEdges = [
    {
        id: 'e1-2',
        type: 'action',
        source: 'example-initial',
        target: 'example-state-off',
        label: 'Reset',
        data:  { name: 'Reset' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
    },
    {
        id: 'e2-3',
        type: 'action',
        source: 'example-state-off',
        target: 'example-state-red',
        label: 'Switch',
        data:  { name: 'Switch' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
    },
    {
        id: 'e3-4',
        type: 'action',
        source: 'example-state-red',
        target: 'example-state-redyellow',
        label: 'Switch',
        data:  { name: 'Switch' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
    },
    {
        id: 'e4-5',
        type: 'action',
        source: 'example-state-redyellow',
        target: 'example-state-green',
        label: 'Switch',
        data:  { name: 'Switch' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
    },
    {
        id: 'e5-6',
        type: 'action',
        source: 'example-state-green',
        target: 'example-state-yellow',
        label: 'Switch',
        data:  { name: 'Switch' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
    },
    {
        id: 'e6-7',
        type: 'action',
        source: 'example-state-yellow',
        target: 'example-state-red',
        label: 'Switch',
        data:  { name: 'Switch' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
    },
    // { 
    //     id: 'e1-2',
    //     source: '1',
    //     target: '2',
    //     label: 'allo?',
    //     markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
    //     name: 'kek'
    // }
];
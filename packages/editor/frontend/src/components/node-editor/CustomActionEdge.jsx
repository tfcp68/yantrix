import {
    BaseEdge,
    EdgeLabelRenderer,
    getStraightPath,
    getBezierPath,
    getSimpleBezierPath,
    useReactFlow,
    MarkerType,
  } from '@xyflow/react';
import { useEffect, useState } from 'react';
   
  export default function CustomActionEdge({ id, data, sourceX, sourceY, targetX, targetY, selected }) {
      const { setEdges, getEdges } = useReactFlow();
      const edges = getEdges();
    const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    });

      const strokeColor = selected ? 'rgb(37 99 235)' : 'white';
    
      const [actionName, setActionName] = useState(data.name || 'New Action');
      const [isEditing, setIsEditing] = useState(false);

      const handleDoubleClick = () => {
          setIsEditing(true);
      };

      const handleBlur = (e) => {
          // setActionName(e.target.value);
          setIsEditing(false);
          setEdges((edges) =>
              edges.map((e) => (e.id === id ? { ...e, name: actionName, data: { ...e.data, name: actionName} } : e))
          );
      };

      const handleEdgeClick = () => {
          setEdges((edges) =>
              edges.map((e) => (e.id === id ? { ...e, selected: true } : { ...e, selected: false }))
          );
    };
    
    return (
      <>
        <BaseEdge id={id} path={edgePath} style={{ stroke: strokeColor }} onClick={handleEdgeClick} />
        <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                      }}
                      className="nodrag nopan"
                >
                    {isEditing ? (
                        <input
                            type="text"
                            value={actionName}
                            onChange={(e) => setActionName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                    handleBlur(e);
                                }
                            }}
                            onBlur={handleBlur}
                            autoFocus
                            className="text-center border border-gray-300 rounded"
                        />
                    ) : (
                        <p
                            onDoubleClick={handleDoubleClick}
                            className={`${
                                selected ? 'text-blue-300' : 'text-green-500'
                            } ${selected ? 'font-bold' : 'font-normal'}`}
                        >
                            {actionName}
                        </p>
                    )}
            </div>
        </EdgeLabelRenderer>
      </>
    );
  }
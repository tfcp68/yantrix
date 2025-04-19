import mermaid from 'mermaid';
import { useRef } from 'react';
import { useEffect } from 'react';
import { Button } from './ui/button';

export const MermaidDiagram = ({ text }) => {

    const mermaidDiagram = useRef(null);

    // startup mermaid so it can create diagrams
    useEffect(() => {
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    }, [])

    // remove 'data-processed' on ref so mermaid can refresh diagram
    useEffect(() => {

        if (text && mermaidDiagram && mermaidDiagram.current) {
            resetTransformData();
            mermaidDiagram.current.removeAttribute('data-processed');
            mermaid.run({
                nodes: [mermaidDiagram.current]
            })
        }
        
    }, [text]);

    const resetTransformData = () => {
        mermaidDiagram.current.dataset.x = 0;
        mermaidDiagram.current.dataset.y = 0;
        mermaidDiagram.current.dataset.scale = 1.0;
        diagramCurrentXTransform = 0;
        diagramCurrentYTransform = 0;
        currentScale = 1.0;
        mermaidDiagram.current.removeEventListener('mousedown', changePositionListener, false);
    }

    useEffect(() => {
        if (mermaidDiagram.current) {
            mermaidDiagram.current.addEventListener('mousedown', changePositionListener, false);
        }
    }, [mermaidDiagram.current])

    // mouse coordinates at the moment of mousedown event
    let mouseX = 0;
    let mouseY = 0;

    let diagramCurrentXTransform = 0;
    let diagramCurrentYTransform = 0;

    const dragSensitivityCoefficient = 1;

    let minimumScale = 0.3;
    let maximumScale = 2.0;
    let scaleStep = 0.1;
    let currentScale = 1.0;

    const updateDiagramTransform = () => {
        const { x, y, scale } = mermaidDiagram.current.dataset;
        const svg = mermaidDiagram.current.querySelector('svg');
        if (svg) {
            svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
    }

    const changeScale = (type) => {
        console.log('x: ', diagramCurrentXTransform);
        const newScale = (type === 'incr')
            ? Math.min(currentScale + scaleStep, maximumScale)
            : Math.max(currentScale - scaleStep, minimumScale);
        currentScale = newScale;
        mermaidDiagram.current.dataset.scale = currentScale;
        updateDiagramTransform();
    }

    const changePositionListener = (e) => {

        // set starting mouse coordinates
        mouseX = e.clientX;
        mouseY = e.clientY;

        const moveListener = (e) => {

            // console.log('mouseX:', mouseX);
            // console.log('mouseY:', mouseY);
            // console.log('clientX:', e.clientX);
            // console.log('clientY:', e.clientY);

            // calculate dx and dy
            let dx = (mouseX - e.clientX) / dragSensitivityCoefficient;
            let dy = (mouseY - e.clientY) / dragSensitivityCoefficient;
            diagramCurrentXTransform -= dx;
            diagramCurrentYTransform -= dy;

            // update current mouse coordinates
            mouseX = e.clientX;
            mouseY = e.clientY;

            mermaidDiagram.current.dataset.x = diagramCurrentXTransform;
            mermaidDiagram.current.dataset.y = diagramCurrentYTransform;

            // apply transform
            updateDiagramTransform();
        };

        // remove move listener once you let go of the mouse button
        const onMouseUpListener = () => {
            mermaidDiagram.current.removeEventListener('mousemove', moveListener, false);
            document.removeEventListener('mouseup', onMouseUpListener, false);
        }

        // add move listener while mouse is still pressed down
        mermaidDiagram.current.addEventListener('mousemove', moveListener, false);

        
        document.addEventListener('mouseup', onMouseUpListener, false)
    }

    return <>
        {text && (
            <div className="relative w-full h-full">
                <pre className="mermaid w-full h-full flex justify-center items-center overflow-hidden"
                    id="mermaid-diagram"
                    ref={mermaidDiagram}
                    data-x={diagramCurrentXTransform} data-y={diagramCurrentYTransform} data-scale={currentScale}
                >
                        {text}
                </pre>
                <div className="flex flex-col gap-1 absolute bottom-20 left-10">
                    <Button
                        className="flex justify-center items-center w-12 h-12"
                        onClick={_ => changeScale('incr')}
                    >
                        <span className="text-2xl">+</span>
                    </Button>
                    <Button
                        className="flex justify-center items-center w-12 h-12"
                        onClick={_ => changeScale('decr')}
                    >
                        <span className="text-2xl">-</span>
                    </Button>
                </div>
            </div>
        ) }
    </>
}
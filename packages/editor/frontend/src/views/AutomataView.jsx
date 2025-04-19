import { Button } from "../components/ui/button"
import { MermaidDiagram } from "../components/MermaidDiagram"
import { useEffect, useState } from "react"
import { CodeView } from "./CodeView";
import { BsCodeSquare } from "react-icons/bs";
import { BsDiagram3Fill } from "react-icons/bs";
import { FaCircleNodes } from "react-icons/fa6";
import { RiLoader4Line } from "react-icons/ri";
import { TfiWrite } from "react-icons/tfi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { NodeEditorView } from "./NodeEditorView";


const ViewSelector = {
    DIAGRAM: 'diagram',
    CODE: 'code',
    INTERACTIVE_EDITOR: 'editor'
};

// todo env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const generateYantrixAutomata = (text) => {
    return fetch(`${BACKEND_URL}/generate`, {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ diagramText: text })
    })
        .then(res => res.json());
}


export const AutomataView = ({ diagramText, editorIsActive, toggleEditor }) => {

    const [activeView, setActiveView] = useState(ViewSelector.INTERACTIVE_EDITOR);
    const [updateInProgress, setUpdateInProgress] = useState(false);

    const [updatedViews, setUpdatedViews] = useState({
        [ViewSelector.DIAGRAM]: false,
        [ViewSelector.CODE]: false,
        [ViewSelector.INTERACTIVE_EDITOR]: false,
    });

    const [errorViews, setErrorViews] = useState({
        [ViewSelector.DIAGRAM]: false,
        [ViewSelector.CODE]: false,
        [ViewSelector.INTERACTIVE_EDITOR]: false,
    })

    const [generatedFiles, setGeneratedFiles] = useState(null);

    const enableDiagramView = () => {
        setActiveView(ViewSelector.DIAGRAM);
        setUpdatedViews(prev => ({
            ...prev,
            [ViewSelector.DIAGRAM]: false
        }))
    }

    const enableCodeView = () => {
        setActiveView(ViewSelector.CODE);
        setUpdatedViews(prev => ({
            ...prev,
            [ViewSelector.CODE]: false
        }))
    }

    const enableInteractiveEditorView = () => {
        setActiveView(ViewSelector.INTERACTIVE_EDITOR);
        setUpdatedViews(prev => ({
            ...prev,
            [ViewSelector.INTERACTIVE_EDITOR]: false
        }))
    }

    useEffect(() => {
        if (diagramText) {
            setUpdateInProgress(true);
            setTimeout(() => {
                generateYantrixAutomata(diagramText)
                    .then(res => {
                        setGeneratedFiles(res);
                        if (res.errorText !== null) {
                            setErrorViews(prev => ({
                                ...prev,
                                [ViewSelector.CODE]: true
                            }))
                        }
                        else {
                            setErrorViews(prev => ({
                                ...prev,
                                [ViewSelector.CODE]: false
                            }))
                        }
                    })
                    .finally(_ => {
                        setUpdateInProgress(false);
                        setUpdatedViews({
                            [ViewSelector.DIAGRAM]: true,
                            [ViewSelector.CODE]: true,
                            [activeView]: false
                        });
                    });
            }, 2000);
        }
    }, [diagramText])

    return (
        <div className="view grow h-full flex flex-col">
            {updateInProgress && <div className="absolute z-10 w-full h-full bg-black/70 animation-fade-in flex gap-3 justify-center items-center transition duration-500 select-none">
                <RiLoader4Line className="animate-spin text-5xl text-white/60"/>
                <h1 className="text-3xl text-white">Updating...</h1>
            </div>}
            <nav className="view-switcher shadow-xl w-full p-2 sticky flex flex-wrap justify-start md:justify-between bg-transparent border-black border-b">
                <div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button variant={editorIsActive ? 'default' : 'outline'} onClick={toggleEditor} className="text-xs font-normal">
                                    <TfiWrite />
                                    {editorIsActive ? 'Hide' : 'Show'} editor
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Hide / show editor</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="view-buttons w-2/4 flex flex-wrap justify-center gap-5">
                    <Button className="select-none transition relative" disabled={activeView === ViewSelector.DIAGRAM} onClick={enableDiagramView}>
                        {updatedViews[ViewSelector.DIAGRAM] && <Ping />}
                        <BsDiagram3Fill />
                        Mermaid Diagram
                    </Button>
                    <Button className="select-none transition relative" disabled={activeView === ViewSelector.CODE} onClick={enableCodeView}>
                        {errorViews[ViewSelector.CODE] ? <Error />
                        : updatedViews[ViewSelector.CODE] ? <Ping /> : undefined}
                        <BsCodeSquare />
                        Automata Code
                    </Button>
                    <Button className="select-none transition relative" disabled={activeView === ViewSelector.INTERACTIVE_EDITOR} onClick={enableInteractiveEditorView}>
                        <FaCircleNodes />
                        Interactive Editor
                    </Button>
                </div>
                <div></div>
            </nav>
            <div className="selected-view grow">
                {activeView === ViewSelector.DIAGRAM && <MermaidDiagram text={diagramText} />}
                {activeView === ViewSelector.CODE && <div className="h-[calc(100%-56px)]"><CodeView generatedFiles={generatedFiles} /></div>}
                {activeView === ViewSelector.INTERACTIVE_EDITOR && <NodeEditorView />}
            </div>
        </div>
    )
}

const Ping = () => (
    <div className="ping absolute top-0 right-0">
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
    </div>
)

const Error = () => (
    <div className="ping absolute top-0 right-0">
        <span className="relative flex h-4 w-4">
            <span className="relative inline-flex justify-center items-center select-none rounded-full h-4 w-4 bg-red-600">!</span>
        </span>
    </div>
)
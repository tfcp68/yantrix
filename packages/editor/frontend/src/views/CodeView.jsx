import { LanguageIcon } from "../components/LanguageIcon";
import { useEffect, useState } from "react"
import { ReadonlyEditor } from "../components/ReadonlyEditor"
import { Button } from "../components/ui/button"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/ui/resizable";
import { BsJournalCode } from "react-icons/bs";

const createGenerationStepsLogs = (files, steps, time, errorText = '') => {
    const SUCCESS = '✔️';
    const ERROR = '❌';
    const UNKNOWN = '❔';
    const step_result = {
        true: SUCCESS,
        false: ERROR,
        undefined: UNKNOWN,
        null: UNKNOWN
    }
    const summary = {
        parsing_text: 'Parsing provided Mermaid diagram code...',
        creating_state_diagram: 'Creating state diagram from the parsed Mermaid diagram...',
        generating_automata: 'Generating automata from the state diagram...',
        formatting_code: 'Formatting code...',
        sending_result: 'Sending result to the client...'
    };
    const lines = [];
    lines.push(new Date(time));
    lines.push('------------')
    const entries = Object.entries(steps);
    let generationIsSuccessful = true;
    entries.forEach((step, index) => {
        lines.push(`STEP ${index + 1} / ${entries.length}: ${summary[step[0]]} ${step_result[step[1]]}`)
        if (step[1] === false) {
            lines.push(`\n${errorText}\n`);
            generationIsSuccessful = false;
        }
    });
    lines.push('\nRESULT: ')
    if (generationIsSuccessful) {
        lines.push('GENERATION SUCCESSFUL');
        lines.push('Created files: ');
        files.forEach(file => {
            lines.push(`- ${file.name}`)
        })
    }
    else {
        lines.push('GENERATION FAILURE')
    }
    return lines.join('\n')
}

export const CodeView = ({ generatedFiles }) => {

    const { files, errorText, steps = {}, timestamp = '' } = generatedFiles;
    const filesPresent = files.length > 0;
    const errorPresent = errorText != null;

    const [selectedFile, setSelectedFile] = useState(null);

    const [logsOpen, setLogsOpen] = useState(errorPresent);

    let text = '';
    let language = '';
    if (logsOpen) {
        text = createGenerationStepsLogs(files, steps, timestamp, errorText);
        language = ''
    }
    else if (errorText) {
        text = `ERROR:\n\n${errorText}`;
        language = ''
    }
    else {
        text = selectedFile?.text ?? ''
        language = selectedFile?.language ?? ''
    }

    const toggleSelectedFile = (index) => {
        if (files && files[index]) {
            setSelectedFile(files[index]);
            setLogsOpen(false);
        }
    }

    const enableLogs = () => {
        setLogsOpen(true);
        setSelectedFile(null);
    }

    useEffect(() => {
        if (files && files[0]) {
            setSelectedFile(files[0]);
            setLogsOpen(false);
        }
        else {
            setSelectedFile(null);
            setLogsOpen(true);
        }
    }, [files]);

    return (
        <ResizablePanelGroup direction="horizontal" className="view w-full h-4/5 flex text-white">
            <ResizablePanel defaultSize={25} className="flex flex-col w-1/5 bg-dark font-secondary">
                <div className="p-2">
                    <h3>Files</h3>
                </div>
                <hr className="mb-2 border-black" />
                <div className="files grow">
                    {filesPresent
                        ? files.map((file, index) => (
                        <Button variant={selectedFile === files[index] ? 'selected' : 'ghost'}
                            key={index}
                            className={`w-full justify-start rounded-none transition-none ${selectedFile === files[index] ? 'font-bold disabled' : ''}`}
                            onClick={e => toggleSelectedFile(index)}
                        >
                            <LanguageIcon language={file.language} />
                            {file.name}
                        </Button>
                        ))
                        : <p className='text-center font-normal text-sm'> -- no files -- </p>
                    }
                </div>
                <div className="log-button">
                    <hr className="mb-2 border-black" />
                    <Button size="lg" variant={ logsOpen ? 'selected' : 'ghost' }
                        className="text-lg w-full text-left font-sans font-normal"
                        onClick={enableLogs}
                    >
                        <BsJournalCode />
                        <p className="text-left">Logs</p>
                    </Button>
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-black opacity-20 hover:opacity-80 transition z-10" />
            <ResizablePanel>
                <ReadonlyEditor text={text} language={language} />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
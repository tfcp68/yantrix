import React, { useState } from "react";
import { FaLongArrowAltLeft, FaTimes } from "react-icons/fa";

const iconOptions = [
  { value: "payload", label: "Payload", icon: "📦" },
  { value: "context", label: "Context", icon: "🧩" },
  { value: "func", label: "Func", icon: "ƒ" },
];

const DirectiveTypes = {
    Context: 'state-context',
    Subscribe: 'subscribe-event',
    Emit: 'emit-event',
}

const VariableOrigins = {
    [DirectiveTypes.Context]: 'State Context',
    [DirectiveTypes.Subscribe]: 'Action Payload',
    [DirectiveTypes.Emit]: 'Event Meta'
}

/*
 * 
type: 'state-context',
parts: [
    {
        left: {
            name: '...',
            default: {
                type: 'number',
                value: 10
            }
        },
        right: {
            type: 'payload',
            name: '...',
            default: {
                type: 'function',
                value: {
                    name: 'myFunc',
                    args: [
                        {
                            name: 'arg1',
                            type: 'string',
                        }
                    ]
                }
            }
        }
    }
]


 */

const createNewRow = () => ({
    left: {
        name: "",
        default: "",
    },
    right: {
        type: "payload",
        name: "",
        default: "",
    }
});

function StateDirectivePanel({ directive = {}, onCancel: cancel, onSave: saveDirectiveHandler, props }) {

    const [selectedDirectiveType, setSelectedDirectiveType] = useState(directive.type || DirectiveTypes.Context);

    const [eventName, setEventName] = useState(directive.event || "");  // for subscribe/emit directives
    const [actionName, setActionName] = useState(directive.action || ""); // for subscribe directives

    
    const [rows, setRows] = useState(directive?.parts || [createNewRow()]);

  const addRow = () =>
    setRows([
      ...rows,
      createNewRow(),
    ]);

    const saveDirective = () => { 

        const newDirective = {
            id: directive.id,
            type: selectedDirectiveType,
            parts: [...rows],
            sourceVars: rows.map(row => row.left.name),
            inputVars: rows.map(row => row.right.name)
        }
        if (selectedDirectiveType === DirectiveTypes.Subscribe) {
            newDirective.event = eventName;
            newDirective.action = actionName;
        }
        if (selectedDirectiveType === DirectiveTypes.Emit) {
            newDirective.event = eventName;
        };

        saveDirectiveHandler(newDirective);

    }
    const cancelDirectiveEdit = () => {
        cancel();
    }

  return (
    <div className="bg-black text-white border rounded-xl p-4">
        <div className="mb-4 font-bold flex items-center gap-3">
          <label htmlFor="directive-type" className="text-base font-bold">Directive type:</label>
          <select
            id="directive-type"
            value={selectedDirectiveType}
            onChange={e => setSelectedDirectiveType(e.target.value)}
            className="bg-gray-800 text-white border rounded px-2 py-1 text-base"
          >
            <option value={ DirectiveTypes.Context }>State Context</option>
            <option value={ DirectiveTypes.Subscribe }>Subscribe to event</option>
            <option value={ DirectiveTypes.Emit }>Emit event</option>
          </select>
          </div>
          {(selectedDirectiveType === DirectiveTypes.Subscribe || selectedDirectiveType === DirectiveTypes.Emit) && (
              <div className="event-name flex items-center gap-3 mb-4">
                  <p>Event name: </p>
                  <input
                    className="bg-gray-800 text-white border rounded px-2 py-1 mb-1"
                    placeholder="EventName"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                />
              </div>
          )}
          {(selectedDirectiveType === DirectiveTypes.Subscribe) && (
              <div className="action-name flex items-center gap-3 mb-4">
                  <p>Action name: </p>
                  <input
                    className="bg-gray-800 text-white border rounded px-2 py-1 mb-1"
                    placeholder="ActionName"
                    value={actionName}
                    onChange={e => setActionName(e.target.value)}
                />
              </div>
          )}
          <div className="side-names flex justify-center gap-10 items-center mb-3">
              <p className="basis-1/2 font-bold">
                  { (VariableOrigins[selectedDirectiveType] + ' variables ') || "Side A" }
              </p>
              <p className="basis-1/2 font-bold">
                  Input variables
              </p>
          </div>
        {rows.map((row, idx) => (
            <React.Fragment key={idx}>
            <div className="flex items-center gap-4 group">
                {/* Left Side */}
                <div className="flex flex-col flex-1">
                <input
                    className="bg-gray-800 text-white border rounded px-2 py-1 mb-1"
                    placeholder="Enter variable name"
                    value={row.left.name}
                    onChange={e => {
                    const newRows = [...rows];
                    newRows[idx].left.name = e.target.value;
                    setRows(newRows);
                    }}
                />
                <div className="flex items-center gap-2">
                    <p className="text-xs">Default: </p>
                    <input
                    className="bg-gray-700 text-white border rounded px-2 py-0.5 text-xs flex-grow"
                    placeholder="Enter default value"
                    value={row.left.default}
                    onChange={e => {
                        const newRows = [...rows];
                        newRows[idx].left.default = e.target.value;
                        setRows(newRows);
                    }}
                    />
                    <button
                    className="bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold ml-1 shadow hover:bg-gray-500 transition-colors"
                    title="Open function panel"
                    onClick={() => {/* open func panel */}}
                    >
                    ƒ
                    </button>
                </div>
                </div>
                {/* Arrow */}
                <div className="flex flex-col items-center mx-2">
                <FaLongArrowAltLeft size={38} color="white" />
                </div>
                {/* Right Side */}
                <div className="flex flex-col flex-1">
                <div className="flex items-center mb-1">
                    <select
                    className="bg-gray-700 text-white border rounded px-1 py-0.5 text-xs mr-2 h-8"
                    value={row.right.type}
                    onChange={e => {
                        const newRows = [...rows];
                        newRows[idx].right.type = e.target.value;
                        setRows(newRows);
                    }}
                    >
                    {iconOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                        </option>
                    ))}
                    </select>
                    <input
                    className="bg-gray-800 text-white border rounded px-2 py-1 flex-1"
                    placeholder="Enter variable name"
                    value={row.right.name}
                    onChange={e => {
                        const newRows = [...rows];
                        newRows[idx].right.name = e.target.value;
                        setRows(newRows);
                    }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-xs">Default: </p>
                    <input
                    className="bg-gray-700 text-white border rounded px-2 py-0.5 text-xs flex-grow"
                    placeholder="Enter default value"
                    value={row.right.default}
                    onChange={e => {
                        const newRows = [...rows];
                        newRows[idx].right.default = e.target.value;
                        setRows(newRows);
                    }}
                    />
                    <button
                    className="bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold ml-1 shadow hover:bg-gray-500 transition-colors"
                    title="Open function panel"
                    onClick={() => {/* open func panel */}}
                    >
                    ƒ
                    </button>
                </div>
                </div>
                {/* Delete Row Button */}
                {rows.length > 1 && (
                  <button
                    className="ml-4 bg-transparent rounded-full p-1 text-white text-lg transition-colors"
                    title="Delete row"
                    onClick={() => {
                      setRows(rows => rows.filter((_, i) => i !== idx));
                    }}
                    style={{ lineHeight: 0 }}
                    onMouseEnter={e => e.currentTarget.classList.add('bg-red-700')}
                    onMouseLeave={e => e.currentTarget.classList.remove('bg-red-700')}
                  >
                    <span className="flex items-center justify-center w-6 h-6">
                      <FaTimes className="transition-colors" />
                    </span>
                  </button>
                )}
            </div>
            {idx < rows.length - 1 && (
                <div className="w-full flex justify-center">
                <div className="border-t border-gray-700 w-full" style={{ margin: '12px 0' }} />
                </div>
            )}
            </React.Fragment>
        ))}
        <div className="flex items-center justify-center w-full">
            <button
                className="mt-5 bg-gray-700 hover:bg-gray-500 transition-colors text-white rounded px-4 py-1 w-2/3"
                onClick={addRow}
            >
                + Add Row
            </button>
          </div>
          
          <div className="actions flex justify-evenly gap-1 mt-5">
            <button
                className=" bg-red-700 hover:bg-red-500 transition-colors text-white rounded py-3 basis-1 min-w-40"
                onClick={cancelDirectiveEdit}
            >
                Cancel
            </button>
            <button
                className=" bg-green-700 hover:bg-green-500 transition-colors text-white rounded py-3 basis-1 min-w-40"
                onClick={saveDirective}
            >
                Save Directive
            </button>
          </div>
    </div>
  );
}

export { StateDirectivePanel };
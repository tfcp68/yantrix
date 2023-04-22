import mermaid from 'mermaid';

const diagramText = `stateDiagram-v2
    [*] --> IDLE: RESET
    note left of IDLE
        emit/harvestNextPlant
        emit/disableTargetMode
        listen/harvestNextPlant => HARVEST
    end note
    state hasRipeCrops <<choice>>
    note left of hasRipeCrops
        predicates/hasRipeCrops
    end note
    IDLE --> hasRipeCrops: HARVEST
    hasRipeCrops --> FINISHED: no
    FINISHED --> [*]
    hasRipeCrops --> HARVESTING: yes
    state hasHarvestEffect <<choice>>
    note right of hasHarvestEffect
        predicates/hasHarvestEffect
    end note
    HARVESTING --> hasHarvestEffect: CROP_HARVESTED(Crop, effectContext?)
    hasHarvestEffect --> IDLE: no
    hasHarvestEffect --> EFFECT_TARGETING: yes
    note right of EFFECT_TARGETING
        emit/enableTargetMode
        listen/forceEndPhase => SKIP
    end note
    EFFECT_TARGETING --> EFFECT_APPLIANCE: EFFECT_APPLIED (Crop)
    note right of EFFECT_APPLIANCE
        emit/disableTargetMode
        emit/applyEffect
        listen/applyEffect => EFFECT_APPLIED
    end note
    EFFECT_APPLIANCE --> IDLE: EFFECT_APPLIED
    EFFECT_TARGETING --> IDLE: SKIP`;

const flowDiagram = 'flowchart TD\n' +
	'    A[Christmas] -->|Get money| B(Go shopping)\n' +
	'    B --> C{Let me think}\n' +
	'    C -->|One| D[Laptop]\n' +
	'    C -->|Two| E[iPhone]\n' +
	'    C -->|Three| F[fa:fa-car Car]';

(async () => {
	mermaid.mermaidAPI.setConfig(mermaid.mermaidAPI.defaultConfig);
	const diagram = await mermaid.mermaidAPI.getDiagramFromText('sequenceDiagram\n' +
		'    Alice->>+John: Hello John, how are you?\n' +
		'    Alice->>+John: John, can you hear me?\n' +
		'    John-->>-Alice: Hi Alice, I can hear you!\n' +
		'    John-->>-Alice: I feel great!');
	console.warn(diagram);
})();

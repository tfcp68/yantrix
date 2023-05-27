import { parseStateDiagram } from '@yantrix/mermaid-parser'

const input1 = `stateDiagram-v2
[*] --> INIT: RESET
INIT --> INTRO: RUN
INTRO --> MAIN_MENU: TO_MENU
MAIN_MENU --> [*]: EXIT
MAIN_MENU --> MAIN_MENU: MENU_HOVER (index)
MAIN_MENU --> GAME_LOBBY: CREATE_GAME (playerId)
MAIN_MENU --> GAME_LOBBY: JOIN_GAME (gameId, playerId)
GAME_LOBBY --> [*]: EXIT
GAME_LOBBY --> MAIN_MENU: TO_MENU
GAME_LOBBY --> GAME_STARTING: START_GAME (gameId, playerIds)
GAME_STARTING --> IN_GAME: BEGIN_GAME (gameId, game)
IN_GAME --> [*]: EXIT
IN_GAME --> SCORE_SCREEN: END_GAME
IN_GAME --> MAIN_MENU: TO_MENU
SCORE_SCREEN --> MAIN_MENU: TO_MENU
SCORE_SCREEN --> [*]: EXIT`

const input2 = `stateDiagram-v2
direction LR
[*] --> FOE
[*] --> PLAYER
[*] --> BED_FOE
[*] --> BED_OWN
[*] --> BED_ANY
[*] --> BED_EMPTY
[*] --> CROP_FOE
[*] --> CROP_OWN
[*] --> CROP_ANY
[*] --> CARD_OWN
[*] --> CARD_MARKET
[*] --> CARD_DISCARDED
[*] --> CROP_COLOR
FOE --> FINISHED: CHOOSE_PLAYER (index)
FOE --> FOE: HOVER (class)
FOE --> [*]: QUIT
PLAYER --> FINISHED: CHOOSE_PLAYER (class)
PLAYER --> PLAYER: HOVER (class)
PLAYER --> [*]: QUIT
BED_FOE --> FINISHED: CHOOSE_BED (class,index)
BED_FOE --> BED_FOE: HOVER (class, index)
BED_FOE --> [*]: QUIT
BED_OWN --> FINISHED: CHOOSE_BED (self,index)
BED_OWN --> BED_OWN: HOVER (self, index)
BED_OWN --> [*]: QUIT
BED_ANY --> FINISHED: CHOOSE_BED (class,index)
BED_ANY --> BED_ANY: HOVER (class, index)
BED_ANY --> [*]: QUIT
BED_EMPTY --> FINISHED: CHOOSE_BED (self,index)
BED_EMPTY --> BED_EMPTY: HOVER (self, index)
BED_EMPTY --> [*]: QUIT
CROP_FOE --> FINISHED: CHOOSE_CROP (class,index)
CROP_FOE --> CROP_FOE: HOVER (class, index)
CROP_FOE --> [*]: QUIT
CROP_OWN --> FINISHED: CHOOSE_CROP (self,index)
CROP_OWN --> CROP_OWN: HOVER (self, index)
CROP_OWN --> [*]: QUIT
CROP_ANY --> FINISHED: CHOOSE_CROP (class,index)
CROP_ANY --> CROP_ANY: HOVER (class, index)
CROP_ANY --> [*]: QUIT
CARD_OWN --> FINISHED: CHOOSE_CARD (index)
CARD_OWN --> CARD_OWN: HOVER (index)
CARD_OWN --> [*]: QUIT
CARD_DISCARDED --> FINISHED: CHOOSE_CARD (index)
CARD_DISCARDED --> CARD_DISCARDED: HOVER (index)
CARD_DISCARDED --> [*]: QUIT
CARD_MARKET --> FINISHED: CHOOSE_MARKET_SLOT (index)
CARD_MARKET --> CARD_MARKET: HOVER (index)
CARD_MARKET --> [*]: QUIT
CROP_COLOR --> FINISHED: CHOOSE_COLOR (color)
CROP_COLOR --> CROP_COLOR: HOVER (index)
CROP_COLOR --> [*]: QUIT
FINISHED --> [*]
end`

const input3 = `stateDiagram-v2
[*] --> PLANNED: RESET
PLANNED --> FINISHED: END
PLANNED --> ROLLING_CHARACTERS: ROLL_CHARACTERS
ROLLING_CHARACTERS --> ROLLING_TURN_ORDER: ROLL_TURN_ORDER
ROLLING_TURN_ORDER --> SETUP: PREPARE
SETUP --> IN_PROGRESS: START
IN_PROGRESS --> IN_PROGRESS: TURN_START
IN_PROGRESS --> IN_PROGRESS: TURN_PHASE_START
IN_PROGRESS --> IN_PROGRESS: TURN_PHASE_END
state isLimitReached <<choice>>
IN_PROGRESS --> isLimitReached: TURN_END
IN_PROGRESS --> FINISHED: END
isLimitReached --> IN_PROGRESS: Coin Limit Not Reached
isLimitReached --> LAST_TURN: Coin Limit Reached
LAST_TURN --> LAST_TURN: TURN_START
LAST_TURN --> LAST_TURN: TURN_PHASE_START
LAST_TURN --> LAST_TURN: TURN_PHASE_END
LAST_TURN --> FINISHED: TURN_END`

const input4 = `stateDiagram-v2
direction LR
[*] --> IDLE: RESET
IDLE --> FINISHED: SKIP
note left of IDLE
    listen/startTrade => START_TRADE
    listen/cropHarvested => ENTER_TARGET_MODE
    listen/cropFertilized => ENTER_TARGET_MODE
    listen/cropPlanted => ENTER_TARGET_MODE
    listen/forceEndPhase => SKIP
    emit/revokeTradeOffers
    emit/disableTargetMode
end note
state hasMoney <<choice>>
note left of hasMoney
    predicates/hasCoins
end note
IDLE --> hasMoney: START_TRADE
hasMoney --> IDLE: no
hasMoney --> HAS_TRADE: yes
HAS_TRADE --> FINISHED: SKIP
HAS_TRADE --> HAS_TRADE: CHANGE_TRADE_OFFER
HAS_TRADE --> OFFER_SENT: MAKE_OFFER
note left of OFFER_SENT
    emit/makeTradeOffer
    listen/completeTrade => predicates/isOwnOffer
    predicates/isOwnOffer => OFFER_ACCEPTED | CANCEL_SELECTION
end note
OFFER_SENT --> IDLE: CANCEL_SELECTION
OFFER_SENT --> IDLE: OFFER_ACCEPTED
OFFER_SENT --> FINISHED: SKIP
state isAffected <<choice>>
note right of isAffected
    predicates/hasEligibleEffectConditions
end note
IDLE --> isAffected: ENTER_TARGET_MODE
isAffected --> IDLE: no
isAffected --> TARGETING: yes
note left of TARGETING
    emit/enableTargetMode
end note
TARGETING --> IDLE: CANCEL_SELECTION
TARGETING --> FINISHED: SKIP
TARGETING --> EFFECT_APPLIED: APPLY_EFFECT
note right of EFFECT_APPLIED
    emit/applyEffect
    emit/disableTargetMode
    listen/applyEffect => APPLY_EFFECT
end note
EFFECT_APPLIED --> IDLE: APPLY_EFFECT
FINISHED --> [*]`

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






const a = await parseStateDiagram(input2)
console.log(a)

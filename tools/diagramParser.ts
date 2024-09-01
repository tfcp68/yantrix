// // import { parseStateDiagram } from '@yantrix/mermaid-parser'

// const input1 = `stateDiagram-v2
// [*] --> INIT: RESET
// [*] --> INIT: Test
// INIT --> INTRO: RUN
// INTRO --> MAIN_MENU: TO_MENU
// MAIN_MENU --> [*]: EXIT
// MAIN_MENU --> MAIN_MENU: MENU_HOVER (index)
// MAIN_MENU --> GAME_LOBBY: CREATE_GAME (playerId)
// MAIN_MENU --> GAME_LOBBY: JOIN_GAME (gameId, playerId)
// GAME_LOBBY --> [*]: EXIT
// GAME_LOBBY --> MAIN_MENU: TO_MENU
// GAME_LOBBY --> GAME_STARTING: START_GAME (gameId, playerIds)
// GAME_STARTING --> IN_GAME: BEGIN_GAME (gameId, game)
// IN_GAME --> [*]: EXIT
// IN_GAME --> SCORE_SCREEN: END_GAME
// IN_GAME --> MAIN_MENU: TO_MENU
// SCORE_SCREEN --> MAIN_MENU: TO_MENU
// SCORE_SCREEN --> [*]: EXIT`;

// const input2 = `stateDiagram-v2
// direction LR
// [*] --> FOE
// [*] --> PLAYER
// [*] --> BED_FOE
// [*] --> BED_OWN
// [*] --> BED_ANY
// [*] --> BED_EMPTY
// [*] --> CROP_FOE
// [*] --> CROP_OWN
// [*] --> CROP_ANY
// [*] --> CARD_OWN
// [*] --> CARD_MARKET
// [*] --> CARD_DISCARDED
// [*] --> CROP_COLOR
// FOE --> FINISHED: CHOOSE_PLAYER (index)
// FOE --> FOE: HOVER (class)
// FOE --> [*]: QUIT
// PLAYER --> FINISHED: CHOOSE_PLAYER (class)
// PLAYER --> PLAYER: HOVER (class)
// PLAYER --> [*]: QUIT
// BED_FOE --> FINISHED: CHOOSE_BED (class,index)
// BED_FOE --> BED_FOE: HOVER (class, index)
// BED_FOE --> [*]: QUIT
// BED_OWN --> FINISHED: CHOOSE_BED (self,index)
// BED_OWN --> BED_OWN: HOVER (self, index)
// BED_OWN --> [*]: QUIT
// BED_ANY --> FINISHED: CHOOSE_BED (class,index)
// BED_ANY --> BED_ANY: HOVER (class, index)
// BED_ANY --> [*]: QUIT
// BED_EMPTY --> FINISHED: CHOOSE_BED (self,index)
// BED_EMPTY --> BED_EMPTY: HOVER (self, index)
// BED_EMPTY --> [*]: QUIT
// CROP_FOE --> FINISHED: CHOOSE_CROP (class,index)
// CROP_FOE --> CROP_FOE: HOVER (class, index)
// CROP_FOE --> [*]: QUIT
// CROP_OWN --> FINISHED: CHOOSE_CROP (self,index)
// CROP_OWN --> CROP_OWN: HOVER (self, index)
// CROP_OWN --> [*]: QUIT
// CROP_ANY --> FINISHED: CHOOSE_CROP (class,index)
// CROP_ANY --> CROP_ANY: HOVER (class, index)
// CROP_ANY --> [*]: QUIT
// CARD_OWN --> FINISHED: CHOOSE_CARD (index)
// CARD_OWN --> CARD_OWN: HOVER (index)
// CARD_OWN --> [*]: QUIT
// CARD_DISCARDED --> FINISHED: CHOOSE_CARD (index)
// CARD_DISCARDED --> CARD_DISCARDED: HOVER (index)
// CARD_DISCARDED --> [*]: QUIT
// CARD_MARKET --> FINISHED: CHOOSE_MARKET_SLOT (index)
// CARD_MARKET --> CARD_MARKET: HOVER (index)
// CARD_MARKET --> [*]: QUIT
// CROP_COLOR --> FINISHED: CHOOSE_COLOR (color)
// CROP_COLOR --> CROP_COLOR: HOVER (index)
// CROP_COLOR --> [*]: QUIT
// FINISHED --> [*]
// end`;

// const input3 = `stateDiagram-v2
// [*] --> PLANNED: RESET
// PLANNED --> FINISHED: END
// PLANNED --> ROLLING_CHARACTERS: ROLL_CHARACTERS
// ROLLING_CHARACTERS --> ROLLING_TURN_ORDER: ROLL_TURN_ORDER
// ROLLING_TURN_ORDER --> SETUP: PREPARE
// SETUP --> IN_PROGRESS: START
// IN_PROGRESS --> IN_PROGRESS: TURN_START
// IN_PROGRESS --> IN_PROGRESS: TURN_PHASE_START
// IN_PROGRESS --> IN_PROGRESS: TURN_PHASE_END
// state isLimitReached <<choice>>
// IN_PROGRESS --> isLimitReached: TURN_END
// IN_PROGRESS --> FINISHED: END
// isLimitReached --> IN_PROGRESS: Coin Limit Not Reached
// isLimitReached --> LAST_TURN: Coin Limit Reached
// LAST_TURN --> LAST_TURN: TURN_START
// LAST_TURN --> LAST_TURN: TURN_PHASE_START
// LAST_TURN --> LAST_TURN: TURN_PHASE_END
// LAST_TURN --> FINISHED: TURN_END`;

// const input4 = `stateDiagram-v2
// direction LR
// [*] --> IDLE: RESET
// IDLE --> FINISHED: SKIP
// note left of IDLE
//     listen/startTrade => START_TRADE
//     listen/cropHarvested => ENTER_TARGET_MODE
//     listen/cropFertilized => ENTER_TARGET_MODE
//     listen/cropPlanted => ENTER_TARGET_MODE
//     listen/forceEndPhase => SKIP
//     emit/revokeTradeOffers
//     emit/disableTargetMode
// end note
// state hasMoney <<choice>>
// note left of hasMoney
//     predicates/hasCoins
// end note
// IDLE --> hasMoney: START_TRADE
// hasMoney --> IDLE: no
// hasMoney --> HAS_TRADE: yes
// HAS_TRADE --> FINISHED: SKIP
// HAS_TRADE --> HAS_TRADE: CHANGE_TRADE_OFFER
// HAS_TRADE --> OFFER_SENT: MAKE_OFFER
// note left of OFFER_SENT
//     emit/makeTradeOffer
//     listen/completeTrade => predicates/isOwnOffer
//     predicates/isOwnOffer => OFFER_ACCEPTED | CANCEL_SELECTION
// end note
// OFFER_SENT --> IDLE: CANCEL_SELECTION
// OFFER_SENT --> IDLE: OFFER_ACCEPTED
// OFFER_SENT --> FINISHED: SKIP
// state isAffected <<choice>>
// note right of isAffected
//     predicates/hasEligibleEffectConditions
// end note
// IDLE --> isAffected: ENTER_TARGET_MODE
// isAffected --> IDLE: no
// isAffected --> TARGETING: yes
// note left of TARGETING
//     emit/enableTargetMode
// end note
// TARGETING --> IDLE: CANCEL_SELECTION
// TARGETING --> FINISHED: SKIP
// TARGETING --> EFFECT_APPLIED: APPLY_EFFECT
// note right of EFFECT_APPLIED
//     emit/applyEffect
//     emit/disableTargetMode
//     listen/applyEffect => APPLY_EFFECT
// end note
// EFFECT_APPLIED --> IDLE: APPLY_EFFECT
// FINISHED --> [*]`;

// const diagramText = `stateDiagram-v2
//     [*] --> IDLE: RESET
//     note left of IDLE
//         emit/harvestNextPlant
//         emit/disableTargetMode
//         listen/harvestNextPlant => HARVEST
//     end note
//     state hasRipeCrops <<choice>>
//     note left of hasRipeCrops
//         predicates/hasRipeCrops
//     end note
//     IDLE --> hasRipeCrops: HARVEST
//     hasRipeCrops --> FINISHED: no
//     FINISHED --> [*]
//     hasRipeCrops --> HARVESTING: yes
//     state hasHarvestEffect <<choice>>
//     note right of hasHarvestEffect
//         predicates/hasHarvestEffect
//     end note
//     HARVESTING --> hasHarvestEffect: CROP_HARVESTED(Crop, effectContext?)
//     hasHarvestEffect --> IDLE: no
//     hasHarvestEffect --> EFFECT_TARGETING: yes
//     note right of EFFECT_TARGETING
//         emit/enableTargetMode
//         listen/forceEndPhase => SKIP
//     end note
//     EFFECT_TARGETING --> EFFECT_APPLIANCE: EFFECT_APPLIED (Crop)
//     note right of EFFECT_APPLIANCE
//         emit/disableTargetMode
//         emit/applyEffect
//         listen/applyEffect => EFFECT_APPLIED
//     end note
//     EFFECT_APPLIANCE --> IDLE: EFFECT_APPLIED
//     EFFECT_TARGETING --> IDLE: SKIP`;

// const flowDiagram
// 	= 'flowchart TD\n'
// 	+ '    A[Christmas] -->|Get money| B(Go shopping)\n'
// 	+ '    B --> C{Let me think}\n'
// 	+ '    C -->|One| D[Laptop]\n'
// 	+ '    C -->|Two| E[iPhone]\n'
// 	+ '    C -->|Three| F[fa:fa-car Car]';

// const seqDiagram1 = `sequenceDiagram
// actor V as Vladimir
// actor P as Petr
// V->>P: Hello John, how are you?
// activate P
// P->V: Great 1!
// P-->V: Great 2!
// P->>V: Great 3!
// P-->>V: Great 4!
// P-xV: Great 5!
// P--xV: Great 6!
// P-)V: Great 7!
// P--)V: Great 8!
// deactivate P
// Note over V,P: Friends
// Note over V: Grade 8
// Note over P: 1st year student`;

// const seqDiagram2 = `sequenceDiagram
// Alice->>+John: Hello John, how are you?
// Alice->>+John: John, can you hear me?
// John-->>-Alice: Hi Alice, I can hear you!
// John-->>-Alice: I feel great!`;

// const seqDiagram3 = `sequenceDiagram
// participant web as Web Browser
// participant blog as Blog Service
// participant account as Account Service
// participant mail as Mail Service
// participant db as Storage

// Note over web,db: The user must be logged in to submit blog posts
// web->>+account: Logs in using credentials
// account->>db: Query stored accounts
// db->>account: Respond with query result

// alt Credentials not found
//     account->>web: Invalid credentials
// else Credentials found
//     account->>-web: Successfully logged in

//     Note over web,db: When the user is authenticated, they can now submit new posts
//     web->>+blog: Submit new post
//     blog->>db: Store post data

//     par Notifications
//         blog--)mail: Send mail to blog subscribers
//         blog--)db: Store in-site notifications
//     and Response
//         blog-->>-web: Successfully posted
//     end
// end`;

// const seqDiagram4 = `sequenceDiagram
// participant Alice
// participant Bob

// Alice->>+John: Hello John, how are you?
// loop Healthcheck
//     John->>John: Fight against hypochondria
// end
// Note right of John: Rational thoughts<br/>prevail...
// John-->>-Alice: Great!
// John->>+Bob: How about you?
// Bob-->>-John: Jolly good!
// `;

// const seqDiagram5 = `sequenceDiagram
// participant A as Alice
// participant B as Bob
// participant C as Centaur
// participant D as Doctor
// participant E as Emelya
// participant F as Fedor
// participant G as George
// participant H as Harry Potter
// participant I as Ivan

// Note over A,A: test01
// Note over A,B: test02
// Note over A,C: test03
// Note over A,D: test04
// Note over A,E: test05
// Note over A,F: test06
// Note over A,G: test07
// Note over A,H: test08
// Note over A,I: test09
// Note over B,B: test10
// Note over B,C: test11
// Note over B,D: test12
// Note over B,E: test13
// Note over B,F: test14
// Note over B,G: test15
// Note over B,H: test16
// Note over B,I: test17
// Note over C,C: test18
// Note over C,D: test19
// Note over F,H: test20

// A-->>I: Hello!`;

// const seqDiagram6 = `sequenceDiagram
// participant Alice
// participant Bob

// Alice->>+John: Hello John, how are you?
// loop Healthcheck
//     John->>John: Fight against hypochondria
// end
// Note right of John: Rational thoughts<br/>prevail...
// John-->>-Alice: Great!
// John->>+Bob: How about you?
// Bob-->>-John: Jolly good!

// Alice->>+John: Hello John, how are you?
// loop Healthcheck
//     John->>John: Fight against hypochondria
// end
// Note right of John: Rational thoughts<br/>prevail...
// John-->>-Alice: Great!
// John->>+Bob: How about you?
// Bob-->>-John: Jolly good!

// Alice->>+John: Hello John, how are you?
// loop Healthcheck
//     John->>John: Fight against hypochondria
// end
// Note right of John: Rational thoughts<br/>prevail...
// John-->>-Alice: Great!
// John->>+Bob: How about you?
// Bob-->>-John: Jolly good!`;

// const stateInput1 = `stateDiagram-v2
// state hasMoney <<choice>>
// Jack --> hasMoney: Does Jack have money?
// hasMoney --> SHOP: yes
// hasMoney --> WORK: no
// state goHome <<choice>>
// note right of hasMoney
//         What should Jack do?
// end note
// SHOP --> goHome
// WORK --> goHome
// goHome --> [*]: Сome back home`;

// const stateInput2 = `stateDiagram-v2
// state c1 <<choice>>
// state "Tiger" as s1
// state "Lion" as s2
// state "Panthera" as s3
// state "Cat" as s4
// note right of c1
//         note123
// end note
// [*] --> s1
// [*] --> s2
// [*] --> s3
// [*] --> s4
// s1 --> c1: t1
// s2 --> c1: t2
// s3 --> c1: t3
// s4 --> c1: t4

// c1 --> s5: t5
// c1 --> s5: t55
// c1 --> s6: t6
// c1 --> s7: t7

// s5 --> [*]
// s6 --> [*]
// s7 --> [*]`;

// const stateInput3 = `stateDiagram-v2
// state test01 <<fork>>
//   [*] --> test01
//   test01 --> State2
//   test01 --> State3

//   state test02 <<join>>
//   State2 --> test02
//   State3 --> test02
//   test02 --> State4
//   State4 --> [*]`;

// const stateInput4 = `stateDiagram-v2
//     state c1 <<choice>>
//     state c2 <<choice>>
//     state "Tiger" as s1
//     state "Lion" as s2
//     state "Panthera" as s3
//     state "Cat" as s4
//     note right of s1
//             meow01
//     end note
//     note left of s1
//             meow02
//             meow03
//             meow04
//     end note
//     note right of c1
//             note123
//     end note
//     note right of c2
//             123note
//     end note
//     note left of c2
//             1234note
//             1note2note3note
//     end note
//     [*] --> s1
//     [*] --> s2
//     [*] --> s3
//     [*] --> s4
//     s1 --> c2: t1
//     s2 --> c1: t2
//     s3 --> c1: t3
//     s4 --> c1: t4

//     c1 --> s7: t11
//     c1 --> c2: t12
//     c1 --> s5: t5
//     c1 --> s6: t6
//     c2 --> s7: t7
//     c2 --> s8: t8
//     s5 --> [*]
//     s6 --> [*]
//     s7 --> [*]
//     s8 --> [*]`;

// const stateDiagramDoublePath = `
//    stateDiagram-v2

//    state ChoiceState1 <<choice>>
//    state ChoiceState2 <<choice>>

//    [*] --> A
//    A --> ChoiceState1
//    ChoiceState1 --> ChoiceState2
//    ChoiceState1 --> B
//    ChoiceState2 --> B
//    ChoiceState2 --> D
//    B --> [*]
//    D --> [*]

//    note left of ChoiceState1
// 		this is multiline
// 		comment left of
// 		first choice
//    end note

//    note right of ChoiceState2
// 		this is another
// 		multiline comment
// 		right of second choice
//    end note
// `;

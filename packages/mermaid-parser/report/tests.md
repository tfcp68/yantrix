# Test Report

| 🕙 Start time        | ⌛ Duration |
| -------------------- | ----------: |
| 12.07.2024, 10:45:05 |     2.247 s |

|             | ✅ Passed | ❌ Failed | ⏩ Skipped | 🚧 Todo | ⚪ Total |
| ----------- | --------: | --------: | ---------: | ------: | -------: |
| Test Suites |        10 |         0 |          0 |       0 |       10 |
| Tests       |        34 |         0 |          0 |       0 |       34 |

## ✅ <a id="file0" href="#file0">**tests**/stateDiagram.test.ts</a> [[link](https://github.com/tfcp68/yantrix/blob/c855fa62ac9ca33ab60bd6440119466f5a2a6be2/packages/mermaid-parser/__tests__/stateDiagram.test.ts)]

15 passed, 0 failed, 0 skipped, 0 todo, done in 358 s

```
✅ State Diagram Parser › Common
   ✅ blankInput
   ✅ invalidDiagram
   ✅ emptyStateDiagram
   ✅ simpleTransition
   ✅ simpleTransitionCompleted
   ✅ simpleTransitionWithComments
   ✅ stateDiagramWithChoice
   ✅ stateDiagramWithFork
   ✅ stateDiagramWithLoopCondition
   ✅ stateDiagramWithLeftSideNote
   ✅ stateDiagramWithRightSideNote
   ✅ stateDiagramWithChoiceAndNote
   ✅ stateDiagramWithSameAction
   ✅ stateDiagramWithNamedStates
   ✅ stateDiagramDoublePath
✅ State Diagram Parser
```

## ✅ <a id="file1" href="#file1">**tests**/stateParser.test.ts</a> [[link](https://github.com/tfcp68/yantrix/blob/c855fa62ac9ca33ab60bd6440119466f5a2a6be2/packages/mermaid-parser/__tests__/stateParser.test.ts)]

19 passed, 0 failed, 0 skipped, 0 todo, done in 396 s

```
✅ State Diagram Parser › Common
   ✅ Empty Input Error
   ✅ Invalid Diagram Type
   ✅ Empty Diagram
✅ State Diagram Parser › Notes
   ✅ One Line
   ✅ Empty Note
   ✅ Left side note
   ✅ Right side note
   ✅ Multiline note
✅ State Diagram Parser › States And Actions
   ✅ Simple Transition
   ✅ Named State
   ✅ Simple Completed Transition
   ✅ Simple Transition With Comments
   ✅ All States To End
   ✅ Double Transitions
✅ State Diagram Parser › Forks
   ✅ Simple
   ✅ Normal
✅ State Diagram Parser › Choices
   ✅ Simple
   ✅ Double Path
   ✅ Loop
✅ State Diagram Parser
```

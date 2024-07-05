# Test Report

| 🕙 Start time        | ⌛ Duration |
| -------------------- | ----------: |
| 05.07.2024, 19:13:09 |     1.291 s |

|             | ✅ Passed | ❌ Failed | ⏩ Skipped | 🚧 Todo | ⚪ Total |
| ----------- | --------: | --------: | ---------: | ------: | -------: |
| Test Suites |        10 |         0 |          0 |       0 |       10 |
| Tests       |        34 |         0 |          0 |       0 |       34 |

## ✅ <a id="file0" href="#file0">**tests**\stateDiagram.test.ts</a> [[link](https://github.com/tfcp68/yantrix/blob/53a2244d20b49a796bc32bf3e46ceeb1496fc8e8/packages\mermaid-parser/__tests__\stateDiagram.test.ts)]

15 passed, 0 failed, 0 skipped, 0 todo, done in 269 s

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

## ✅ <a id="file1" href="#file1">**tests**\stateParser.test.ts</a> [[link](https://github.com/tfcp68/yantrix/blob/53a2244d20b49a796bc32bf3e46ceeb1496fc8e8/packages\mermaid-parser/__tests__\stateParser.test.ts)]

19 passed, 0 failed, 0 skipped, 0 todo, done in 265 s

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

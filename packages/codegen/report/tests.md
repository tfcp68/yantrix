# Test Report

| 🕙 Start time        | ⌛ Duration |
| -------------------- | ----------: |
| 12.07.2024, 16:01:22 |     0.752 s |

|             | ✅ Passed | ❌ Failed | ⏩ Skipped | 🚧 Todo | ⚪ Total |
| ----------- | --------: | --------: | ---------: | ------: | -------: |
| Test Suites |         9 |         0 |          0 |       0 |        9 |
| Tests       |        18 |         0 |          0 |       0 |       18 |

## ✅ <a id="file0" href="#file0">**tests**/codegenAutomata.test.ts</a> [[link](https://github.com/tfcp68/yantrix/blob/2e42788043a9e2bfd7432bdc724442dbbb6da77a/packages/codegen/__tests__/codegenAutomata.test.ts)]

9 passed, 0 failed, 0 skipped, 0 todo, done in 8 s

```
✅ Codegen output › GamePhaseAutomata
   ✅ Initial state
   ✅ The context and state do not change with the wrong action.
   ✅ [{"action":1423436384,"payload":{}}] -- > 45657535
   ✅ [{"action":1423436384,"payload":{}},{"action":1481692,"payload":{}}] -- > 1415394173
   ✅ [{"action":1423436384,"payload":{}},{"action":1481692,"payload":{}},{"action":99594860,"payload":{}}] -- > 1918712022
   ✅ [{"action":1423436384,"payload":{}},{"action":1481692,"payload":{}},{"action":99594860,"payload":{}},{"action":1675466392,"payload":{}}] -- > 487317864
   ✅ [{"action":1423436384,"payload":{}},{"action":1481692,"payload":{}},{"action":99594860,"payload":{}},{"action":1675466392,"payload":{}},{"action":383736638,"payload":{}},{"action":1225901225,"payload":{}}] -- > 1301012547
   ✅ [{"action":1423436384,"payload":{}},{"action":1481692,"payload":{}},{"action":99594860,"payload":{}},{"action":1675466392,"payload":{}},{"action":383736638,"payload":{}},{"action":1225901225,"payload":{}},{"action":808645083,"payload":{}}] -- > 1404098696
   ✅ [{"action":1423436384,"payload":{}},{"action":1481692,"payload":{}},{"action":99594860,"payload":{}},{"action":1675466392,"payload":{}},{"action":383736638,"payload":{}},{"action":1225901225,"payload":{}},{"action":808645083,"payload":{}}] -- > 1404098696
✅ Codegen output
```

## ✅ <a id="file1" href="#file1">**tests**/codegenNotes.test.ts</a> [[link](https://github.com/tfcp68/yantrix/blob/2e42788043a9e2bfd7432bdc724442dbbb6da77a/packages/codegen/__tests__/codegenNotes.test.ts)]

9 passed, 0 failed, 0 skipped, 0 todo, done in 8 s

```
✅ Automata include notes › Initial context
   ✅ Initial context =  string: str, integer: 3, array: [],
✅ Automata include notes › Previus context to context
   ✅ Assign previus context to current context between states
✅ Automata include notes › Dispatch action include payload › Initial assign value
   ✅ Initial payload,  initial context empty === #{a1,a2, a3} <= (a1=`string`, a2=3, a3=[])
   ✅ Initial payload, initial context === #{a1=[],a2=`string`, a3=3} <= (a1=`string`, a2=3, a3=[])
   ✅ Empty payload, inital context
✅ Automata include notes › Dispatch action include payload
   ✅ From payload to existed initial context #{integer} <= (newInteger)
   ✅ From empty payload to existed initial context #{integer} <= ({})
   ✅ From payload to new context declaration #{a1,a2,a3} <= (a1,a2,a3)
   ✅ From empty payload to new context declaration #{a1,a2,a3} <= ({})
✅ Automata include notes
```

# Test Report

| 🕙 Start time        | ⌛ Duration |
| -------------------- | ----------: |
| 8/6/2024, 3:28:38 PM |     0.772 s |

|             | ✅ Passed | ❌ Failed | ⏩ Skipped | 🚧 Todo | ⚪ Total |
| ----------- | --------: | --------: | ---------: | ------: | -------: |
| Test Suites |         3 |         0 |          0 |       0 |        5 |
| Tests       |        10 |         5 |          0 |       0 |       15 |

## ✅ <a id="file0" href="#file0">**tests**/codegenAutomata.test.ts</a>

9 passed, 0 failed, 0 skipped, 0 todo, done in 3 s

```
✅ Codegen output › GamePhaseAutomata
   ✅ Initial state
   ✅ The context and state do not change with the wrong action.
   ✅ [{"action":77866287,"payload":{}}] -- > 2252048
   ✅ [{"action":77866287,"payload":{}},{"action":81515,"payload":{}}] -- > 69824076
   ✅ [{"action":77866287,"payload":{}},{"action":81515,"payload":{}},{"action":407301981,"payload":{}}] -- > 1730055131
   ✅ [{"action":77866287,"payload":{}},{"action":81515,"payload":{}},{"action":407301981,"payload":{}},{"action":1973300761,"payload":{}}] -- > 1929949911
   ✅ [{"action":77866287,"payload":{}},{"action":81515,"payload":{}},{"action":407301981,"payload":{}},{"action":1973300761,"payload":{}},{"action":1058895409,"payload":{}},{"action":1626434024,"payload":{}}] -- > 1608719668
   ✅ [{"action":77866287,"payload":{}},{"action":81515,"payload":{}},{"action":407301981,"payload":{}},{"action":1973300761,"payload":{}},{"action":1058895409,"payload":{}},{"action":1626434024,"payload":{}},{"action":1757631242,"payload":{}}] -- > 1985829159
   ✅ [{"action":77866287,"payload":{}},{"action":81515,"payload":{}},{"action":407301981,"payload":{}},{"action":1973300761,"payload":{}},{"action":1058895409,"payload":{}},{"action":1626434024,"payload":{}},{"action":1757631242,"payload":{}}] -- > 1985829159
✅ Codegen output
```

## ❌ <a id="file1" href="#file1">**tests**/codegenNotes.test.ts</a>

1 passed, 5 failed, 0 skipped, 0 todo, done in 14 s

```
❌ Default assign
   ✅ {a1} <= $b1 = string | number | list | $payloadProperyy
   ❌ {a1} <= b1 == 5 (payload { payload: { b1: null } }, setting default value)
   ❌ {a1} <= b1 == 5 (payload { payload: {} }, setting default value)
   ❌ {a2 = 10} <= b2 (empty payload { payload: { b2: null } }, setting context  default value 10)
   ❌ {a3 = "str"} <= $b3 = "payloadStr" (ignore default assign, setting passed payload b3=300)
   ❌ {a4} <=  $b4 = $c (reference to another payload property, b4=null, c = 100)
```

You are making a git commit for the Yantrix monorepo.

The argument (if provided) is the full commit message to use verbatim.

Follow these steps exactly:

## 1. Determine commit message

If an argument was provided, use it as-is and skip to step 2.

If no argument was provided:
- Run `git diff --cached --stat` and `git diff --cached --name-only` to understand the staged changes.
- Derive an appropriate message following the convention:
  `(revert: )?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|types|merge)(\(.+\))?!?: <subject up to 72 chars>`
  - type: pick the best fit from the list above
  - scope (optional): the affected package or area, e.g. `codegen`, `core`, `docs`
  - subject: imperative, lowercase first letter, no trailing dot
- Present the proposed message to the user and wait for explicit confirmation before continuing.

## 2. Validate message

Check the message against:
```
/^(revert: )?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|types|merge)(\(.+\))?!?: .{1,72}$/
```

If it does not match, refuse to commit and state exactly which part of the regex failed.
Do NOT add `Co-Authored-By` or any trailer lines.

## 3. Pre-flight ESLint fix

Run `git diff --cached --name-only` and collect files matching `*.{js,jsx,ts,tsx,cjs,mjs}`.
If any such files are staged, run:
```
pnpm eslint --fix <file1> <file2> ...
```
Then re-stage any files that were modified by ESLint:
```
git add <those files>
```

## 4. Commit

Run the commit and capture both stdout and stderr:
```
git commit -m "<message>" 2>&1
```

## 5. Handle result

On success: report the short commit hash and message.

On failure:
- Print the full captured output so it can be analyzed.
- If the output contains failures related to `yantrix-parser` (e.g. test files under
  `packages/yantrix-parser` failing to import from `dist`), run the recovery script:
  ```
  pnpm precommit:fix
  ```
  Then retry the commit exactly once (same message, no --no-verify).
- If the retry also fails, print that output and stop. Do not loop or bypass hooks.
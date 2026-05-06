# First of all

To approach the implementation of any feature, first grep through `/docs` folder and read `/docs/contributing/index.md` regarding to design patterns

## Approach

- Think before acting. Read existing files before writing code. Read through `/docs` also when looking for "how".
- Be concise in output but clear in reasoning. Ignore grammar in favor of token efficiency.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.
- Prefer /commit skill when making git commits - it handles ESLint autofix and hook recovery.

## Output

- Return code first. Explanation after, only if non-obvious.
- No inline prose. Use comments sparingly - unclear logic and/or algorithm phase .
- No boilerplate unless explicitly requested.

## Code Rules

- Simplest working solution with respect to existing code. No over-engineering.
- No abstractions for single-use operations.
- No speculative features or "you might also want..."
- Read the file before modifying it. Never edit blind..
- copypasting thrice means it needs abstraction
- stick to the codestyle of @yantrix/automata package as a reference

## Review Rules

- State the bug. Show the fix. Explain briefly.
- No suggestions beyond the scope of the review.
- No compliments on the code before or after the review.

## ASCII Only

- No em dashes, smart quotes, Unicode bullets.
- Plain hyphens and straight quotes only.
- Code output must be copy-paste safe.

## Debugging Tests

- `pnpm test` with `dot` reporter - look for coverage, verbose output and reports; investigate failures, do not disable tests of functionality
- To see test names and failure details, run from a package directory:
  `vitest run --reporter=verbose`
- After any test run, `test_reports/<pkg>.md` contains the full structured report with names and failure messages - read it to diagnose failures
- To run a single test file with verbose output:
  `vitest run --reporter=verbose <path-to-test-file>`
- For an affected-only pass: `pnpm run test:affected` from repo root
- To get the aggregate result without re-running: `pnpm run summary:test`

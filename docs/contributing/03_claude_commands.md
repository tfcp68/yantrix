---
title: Claude Code Slash Commands
---

# Claude Code Slash Commands

If you use [Claude Code](https://claude.ai/code) as your AI assistant, this repository ships
a set of slash commands under `.claude/commands/` that automate common development tasks.
These commands are entirely optional - all the workflows they cover can be done manually.

## /commit

```
/commit [message]
```

A safe wrapper around `git commit` that handles two recurring pain points in this repo:

- **Pre-flight ESLint fix** - runs `pnpm eslint --fix` on all staged JS/TS files and
  re-stages any changed files before the commit, so `lint-staged` in the pre-commit hook
  does not produce unexpected diffs.
- **Hook failure recovery** - if the pre-commit hook fails because `pnpm clean` deleted
  `@yantrix/yantrix-parser`'s `dist` and turbo cannot resolve cross-package imports,
  the command runs `pnpm precommit:fix` (which rebuilds the parser) and retries once.

If `message` is omitted, the command inspects the staged diff and proposes a message
following the [commit convention](02_git_commit_naming_convention.md), then waits for
your confirmation before proceeding.

The message is validated against the convention regex before the commit is attempted.
No `Co-Authored-By` trailers are added. Hooks are never bypassed.

## /changelog

```
/changelog [tag]
```

Generates a new release entry in `CHANGELOG.md` for the given tag (or auto-detects the
next unreleased tag). Reads the git log between the two most recent tags, filters for
meaningful commits, and writes a structured entry in the established format.

See [CHANGELOG.md](../../CHANGELOG.md) for examples of the output format.

You are appending a new release entry to CHANGELOG.md in the Yantrix monorepo.
Follow these steps exactly:

1. Read `CHANGELOG.md`. Find the first `## [vX.Y.Z]` heading - that is the most recently
   documented version (call it PREV_VERSION).

2. Read `packages/automata/package.json` and extract the `version` field.
   This is TARGET_VERSION (e.g. `0.4.4`). Format it as `v0.4.4` for headings.
   If TARGET_VERSION already appears as a `## [vX.Y.Z]` heading in CHANGELOG.md,
   stop and report that the changelog is already up to date.

3. Find the commit that last bumped the `version` field in
   `packages/automata/package.json` to TARGET_VERSION:
   ```
   git log --follow --format="%H %s" -- packages/automata/package.json
   ```
   Walk the list from newest to oldest; the first commit whose diff shows
   `"version": "<TARGET_VERSION>"` being introduced is TARGET_COMMIT.

4. Find BASE_COMMIT: the commit immediately before TARGET_COMMIT that also
   changed `packages/automata/package.json` with a different (lower) version.
   Run:
   ```
   git log --follow --format="%H %s" -- packages/automata/package.json
   ```
   and take the entry directly after TARGET_COMMIT in that list.
   BASE_COMMIT is that commit's hash (the state just before the bump).

5. Run:
   `git log --format="%s%n%b" BASE_COMMIT..TARGET_COMMIT`
   Filter out lines that are merge commits, start with `[autofix.ci]`, or match
   `chore: release` or `chore: bump`. Keep feat, fix, refactor, docs, test, perf, build commits only.
   For each kept commit, include the full subject and body.

6. Write the new entry eloquently using the same format as existing entries in
   CHANGELOG.md:

   ```markdown
   ## [vTARGET_VERSION]

   One paragraph summary (2-4 sentences). Name the affected packages, describe what
   changed at a feature level, and state whether there are breaking changes.

   ### Breaking Changes        <- omit section entirely if none; raise if it's the patch version change

   Named subsection per breaking change. State what was removed or renamed and what
   replaces it. Include old and new symbol names.

   ### New Features        <- omit if patch version change, move overview to summary above

   Named subsection per significant feature or affected package. Use the same depth
   as existing entries: method signatures, parameter names, file paths, behaviour
   differences. Do not list trivial commits.

   ### Other Changes           <- omit section entirely if none

   Bullet list for fixes, docs, test, build entries that are not significant enough
   for their own subsection.  Use more detailed explanation for major version changes
   ```

   The higher the tier of changed version is (major, minor, patch), the more details are required in regards to every block. Keep it concise and efficient, yet cover important stuff in slightly more detail.

7. Insert the new entry into CHANGELOG.md:
   - Immediately after the `## Table of Contents` block (after the last TOC list item
     and its blank line), before the existing first `## [v...]` entry.
   - Add a `---` separator after the new entry.
   - Add the new version to the top of the TOC with sub-links matching those of
     adjacent entries.

8. Report: which version range was processed (BASE_COMMIT..TARGET_COMMIT, with the
   corresponding version strings), how many substantive commits were included,
   and the first line of the new Summary paragraph.

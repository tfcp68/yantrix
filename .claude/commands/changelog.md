You are appending a new release entry to CHANGELOG.md in the Yantrix monorepo.
The argument (if provided) is the target version from `package.json`, e.g. `0.5.0`.

Follow these steps exactly:

1. Read `CHANGELOG.md`. Find the first `## [vX.Y.Z]` heading - that is the most recently
   documented version (call it PREV_TAG).

2. Run `git tag --sort=version:refname` to list all tags.

3. Determine TARGET_TAG:
   - If `version` in `package.json` is higher than the latest tag, use the `version`.
   - Otherwise, take the highest tag from the list that does not already appear as a
     `## [vX.Y.Z]` heading in CHANGELOG.md.

4. Find the last version bump immediately before TARGET_TAG in the list (call it BASE_TAG).

5. Run:
   `git log --format="%s%n%b" BASE_TAG..TARGET_TAG`
   Filter out lines that are merge commits, start with `[autofix.ci]`, or match
   `chore: release`. Keep feat, fix, refactor, docs, test, perf, build commits only.
   For each kept commit, include the full subject and body.

6. Write the new entry eloquently using the same format as existing entries in
   CHANGELOG.md:

   ```markdown
   ## [TARGET_TAG]

   One paragraph summary (2-4 sentences). Name the affected packages, describe what
   changed at a feature level, and state whether there are breaking changes.

   ### Breaking Changes        <- omit section entirely if none

   Named subsection per breaking change. State what was removed or renamed and what
   replaces it. Include old and new symbol names.

   ### New Features

   Named subsection per significant feature or affected package. Use the same depth
   as existing entries: method signatures, parameter names, file paths, behaviour
   differences. Do not list trivial commits.

   ### Other Changes           <- omit section entirely if none

   Bullet list for fixes, docs, test, build entries that are not significant enough
   for their own subsection.
   ```

   Use less details and specificity for small (patch) version changes, i.e. just short desciprtions in each block. Keep it concise and efficient, yet cover important stuff in slightly more detail. 

7. Insert the new entry into CHANGELOG.md:
   - Immediately after the `## Table of Contents` block (after the last TOC list item
     and its blank line), before the existing first `## [v...]` entry.
   - Add a `---` separator after the new entry.
   - Add the new version to the top of the TOC with sub-links matching those of
     adjacent entries.

8. Report: which version range was processed, how many substantive commits were included,
   and the first line of the new Summary paragraph.

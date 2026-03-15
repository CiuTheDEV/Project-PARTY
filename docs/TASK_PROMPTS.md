# TASK_PROMPTS.md

These templates help create reliable prompts for AI coding agents.

## PLAN Template

```md
MODE: PLAN

Read AGENTS.md and required reading files.

# Task
[Describe the task]

# Goal
[Describe the expected result]

# Product Level
[platform / shared / specific game module]

# Scope
[List folders/files for analysis]

# Out of Scope
[List exclusions]

# Constraints
- respect platform vs game boundaries
- keep plan short
- prefer micro-builds
- do not generalize prematurely

# Output
1. Proposed plan
2. Affected areas
3. Risks
```

## EXECUTE Template

```md
MODE: EXECUTE

Read AGENTS.md and required reading files.

# Task
[Describe the exact implementation task]

# Goal
[Describe expected visible/functional result]

# Product Level
[platform / shared / specific game module]

# Scope
[List allowed files/folders]

# Out of Scope
[List forbidden areas]

# Constraints
- minimal change
- no unrelated refactors
- use existing systems/components
- keep game-specific logic inside the game unless clearly shared

# Validation
[Describe minimal validation]

# Output
1. Plan
2. Changed files
3. Validation
4. Risks
```

## REVIEW Template

```md
MODE: REVIEW

Read AGENTS.md and required reading files.

# Task
[Describe what should be reviewed]

# Scope
[List files/folders to inspect]

# Focus Areas
- architecture alignment
- platform vs game ownership
- regression risk
- UI consistency
- abstraction sanity

# Output
1. Observations
2. Potential issues
3. Suggested improvements
4. Risk level
```

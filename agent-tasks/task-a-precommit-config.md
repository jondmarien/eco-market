# Task A - Create .pre-commit-config.yaml

## Description
Create the `.pre-commit-config.yaml` at the root of the repository with the specified staged checks.

## Instructions
- Add: universal checks (`trailing-whitespace`, `end-of-file-fixer`, `detect-secrets`)
- Add: JS/TS checks (`prettier`, `eslint --fix` via `pre-commit/eslint`)
- Add: Python checks (`black`, `isort`, `flake8`)
- Add: Go checks (`gofmt`, `go vet`, `golangci-lint`)
- Add: Docs check (`markdownlint-cli2`)

## Dependencies
None

## Files
- `.pre-commit-config.yaml`

## Current Status
✅ CLAIMED by Agent 1

## Completion
- Create a `task-a-precommit-config.completed` file when done.

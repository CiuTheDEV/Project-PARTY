# Playwright Tooling Design

## Goal
Make browser automation work reliably from this repo without depending on Windows Chrome, UNC paths, or WSL-to-Windows browser control.

## Approach
Use repo-local Playwright from Linux/WSL only:
- install `playwright` as a root dev dependency
- keep browser binaries in a repo-local cache directory
- add one small smoke/debug script that opens the local web app and reports browser errors

## Boundaries
- no product behavior changes
- no Playwright test framework rollout across the repo
- no Windows-side wrappers

## Success criteria
- Playwright can launch a Linux browser from repo-local scripts
- the script can open `http://127.0.0.1:5174`
- the script can report current URL, console errors, page errors, and failed requests

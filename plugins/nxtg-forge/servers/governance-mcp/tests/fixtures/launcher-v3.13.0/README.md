The governance-mcp launcher as released in v3.13.0 (`git show v3.13.0:plugins/nxtg-forge/servers/governance-mcp/start.sh`
and `package.json`), frozen for `tests/first-launch.test.mjs`. It is the red control: on a first launch it runs
`npm install` before it starts the server, so it misses Claude Code's startup window on a slow or cold npm
(alpha outside re-run, CLX9, DIRECTIVE-NXTG-20261014-01). Do not edit these files.

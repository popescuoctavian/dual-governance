# Dual Governance — Hardhat 3 Migration Report

**Hardhat version installed:** `^3.3.0`
**Migration date:** 2026-04-06
**Foundry analysis:** [Foundry analysis](dual-governance-foundry-migration-analysis.md)

---

**Verdict:** 🟡 **Successful with gaps**

### Summary

All 864 non-fork unit tests pass. Fork tests pass individually but hit Alchemy free-tier rate limits when run concurrently. One regression test (`ResealManagerRegressionTest`) fails due to missing on-chain permissions — not a migration issue.

### Gaps

- 🚩 `Deployment scripting` — all scripts in `scripts/` unusable via Hardhat; no equivalent for `forge script`

### Notable gaps (non-blocking, medium+ impact)

- 🚩 `Test path filtering` — Kontrol tests moved to `kontrol-tests/` as workaround; would need `no-match-path` equivalent if kept under `test/`

### Other issues not related to migration

- Fork tests require `MAINNET_RPC_URL` to be set; hit RPC rate limits when run concurrently — run in batches or use a higher-tier RPC
- `ResealManagerRegressionTest#testFork_Reseal_HappyPath()` fails — ResealManager missing `PAUSE_ROLE`/`RESUME_ROLE` on mainnet sealable contracts; passes with `GRANT_REQUIRED_PERMISSIONS=true`; same behavior in Forge

## 1. Test Count Comparison

| Metric | Count |
|--------|-------|
| `function test*` declarations (excluding `kontrol-tests/`) | 921 |
| Hardhat tests passing | 864 |
| Hardhat tests failing | 23 |
| Hardhat tests pending/skipped | 3 |

Note: Some test contracts' `setUp()` fails (due to RPC rate limits), preventing their child test functions from running — Hardhat counts the `setUp()` failure as 1 failure rather than counting each child test individually.

### Failure breakdown (with `MAINNET_RPC_URL` set)

| Category | Count | Root cause |
|----------|-------|------------|
| Fork RPC rate limiting | 22 | `vm.createSelectFork` fails with HTTP 429 or connection errors when all fork tests run concurrently against Alchemy free tier. Tests pass when run individually or in small batches. |
| On-chain permissions | 1 | `ResealManagerRegressionTest#testFork_Reseal_HappyPath()` — ResealManager lacks `PAUSE_ROLE`/`RESUME_ROLE` on mainnet sealable contracts. Passes with `GRANT_REQUIRED_PERMISSIONS=true`. Same behavior in Forge. |

### Pending/skipped tests (3)

| Test | Reason |
|------|--------|
| `HoodiLaunch` | Uses `vm.envOr` with defaults, setUp succeeds but tests skipped |
| `DisconnectedContractsRegressionTest` | Same |
| `EscrowSolvencyTest` | Same |

## 2. Feature Parity

### Gaps, bugs & partial support

| Feature | Parity | Impact | Workaround / Notes |
|---------|--------|--------|--------------------|
| `Deployment scripting` | 🚩 **Gap** | **High** — all scripts in `scripts/` unusable via Hardhat | No Hardhat equivalent for `forge script`. Hardhat Ignition is the deployment framework but requires rewriting scripts |
| `Test path filtering` | 🚩 **Gap** | **Medium** — Kontrol tests moved to `kontrol-tests/` on this branch; would need exclusion if kept under `test/` | No tracking issue found — consider filing one. Workaround: move tests outside `test/` directory |
| `Compiler warning suppression` | 🚩 **Gap** | **Low** — Kontrol test warnings cannot be suppressed via `ignored_warnings_from` | No tracking issue found |
| `Memory limit` | 🚩 **Gap** | **Low** — no Hardhat equivalent for `memory_limit` (16 GB) | No tracking issue found |
| Etherscan verification | 🟡 **Partial** | **Low** — Hardhat uses Etherscan API v2 (single key for all chains); Foundry allows per-chain keys with custom URLs. This project already uses a single key. | Consolidate to single `ETHERSCAN_API_KEY` — already the case here |

### Full parity

These features work equivalently in Hardhat 3:

- Solidity compilation (`forge build` → `npx hardhat compile`) — 49 source + 113 test files compiled successfully
- forge-std cheatcodes (`vm.*`) — all standard cheatcodes work correctly
- Fuzz testing — runs with default 256 runs
- EVM version `cancun` — supported
- Optimizer settings — enabled with 200 runs (Forge default, explicitly set)
- `fs_permissions` — mapped to `fsPermissions` config
- `gas_limit` — mapped to `gasLimit` bigint
- Coverage (`forge coverage` → `npx hardhat test solidity --coverage`) — built-in support
- Gas snapshots (`--snapshot` / `--snapshot-check`) — supported since Hardhat 3.3.0
- Remappings (`remappings.txt`) — natively loaded
- Submodule dependencies (`lib/`) — resolved via remappings

**Features not used by this project:**

- Inline test config (`forge-config:`) — no inline directives found in codebase
- Invariant testing — no `invariant_*` test functions found
- `via_ir` compilation — not enabled
- Multiple compiler versions — all files use 0.8.26
- FFI — not enabled
- `allow_internal_expect_revert` — not needed

## 3. Test Discovery: `TestOmnibus` Harness Fix

Hardhat 3 identifies test contracts by looking for functions prefixed with `test` (per [Hardhat documentation](https://hardhat.org/docs)). The `TestOmnibus` harness contract in `test/unit/scripts/launch/OmnibusBase.t.sol` had two functions — `testForwardCall()` and `testVotingCall()` — that triggered test detection. Since it has a `constructor(address voting)`, Hardhat tried to deploy it without arguments and failed.

**Fix applied:** Renamed the harness functions to `forwardCall()` and `votingCall()` (dropping the `test` prefix). The contract name `TestOmnibus` was kept since name alone doesn't trigger detection — only `test`-prefixed functions do. All 5 `OmnibusBaseTest` tests now pass.

## 4. ResealManager On-Chain Permissions Issue

`ResealManagerRegressionTest#testFork_Reseal_HappyPath()` fails because the ResealManager contract (`0x2bcee7d22082d0ffe3920d43974a165a5d982126`) does not have `PAUSE_ROLE` or `RESUME_ROLE` on the sealable withdrawal blocker contracts on mainnet. The test attempts to call `pauseFor()` via `vm.startPrank(resealManager)` and gets:

```
AccessControl: account 0x2bcee7d22082d0ffe3920d43974a165a5d982126 is missing role 0x139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d
```

This is **not a migration issue** — the same failure occurs in Forge against the current mainnet state. The test includes a `GRANT_REQUIRED_PERMISSIONS=true` env var escape hatch in `setUp()` that grants the missing roles via `vm.prank`, and the test passes with it enabled.

## 5. Workarounds Applied

### `TestOmnibus` harness function rename

Renamed `testForwardCall()` → `forwardCall()` and `testVotingCall()` → `votingCall()` in the `TestOmnibus` harness contract to prevent Hardhat from detecting it as a test contract. Updated call sites in `OmnibusBaseTest` accordingly.

**Root cause:** Hardhat identifies test contracts by looking for `test`-prefixed functions. The `TestOmnibus` harness had helper functions with the `test` prefix that were not actual tests.

### Kontrol tests moved

The `test/kontrol/` directory was moved to `kontrol-tests/` on this branch. These tests use Kontrol-specific cheatcodes unsupported by Hardhat and were excluded in Forge via `no-match-path = 'test/kontrol/*'`.

**Root cause:** Hardhat has no `no-match-path` equivalent for excluding test directories. Forge supports glob-based path exclusion; Hardhat does not.

### Remappings for absolute imports

Added remappings to `remappings.txt` for absolute import prefixes used across 123 files:
```
contracts/=./contracts/
test/=./test/
scripts/=./scripts/
forge-std/=lib/forge-std/src/
kontrol-cheatcodes/=lib/kontrol-cheatcodes/src/
```

**Root cause:** Forge resolves absolute imports via `libs = ['node_modules', 'lib']` which searches all listed directories. Hardhat 3 uses Node.js module resolution and does not support bare absolute imports. Remappings bridge the gap by explicitly mapping each prefix to its local path.

### ESM module type

Added `"type": "module"` to `package.json` as required by Hardhat 3. The project's existing JS files (if any) may need updating to ESM syntax.

### Hardhat output directories

`artifacts/` and `cache/` were already in `.gitignore`.

## 6. Next Steps

1. **Address fork test rate limiting** — run fork tests in batches (by directory: `test/unit/`, `test/scenario/`, `test/regressions/`), use a higher-tier RPC provider, or run against a local node to avoid Alchemy free-tier 429 errors.

2. **Investigate ResealManager permissions** — determine whether `PAUSE_ROLE`/`RESUME_ROLE` will be granted to the ResealManager on mainnet as part of the DG launch process, or whether the test should always run with `GRANT_REQUIRED_PERMISSIONS=true`.

3. **Request test exclusion feature** from Hardhat — if Kontrol tests need to coexist in the `test/` directory in the future, a `no-match-path` equivalent is needed.

4. **Evaluate Hardhat Ignition** for deployment script migration — the project's `scripts/` directory contains Forge scripts (`.s.sol`) that have no direct Hardhat equivalent. This is a significant effort and may be deferred.
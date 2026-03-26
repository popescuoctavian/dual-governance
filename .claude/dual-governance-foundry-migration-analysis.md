# Dual Governance — Foundry Migration Analysis

## foundry.toml settings

### [profile.default]
| Setting | Value |
|---------|-------|
| `evm_version` | `cancun` |
| `src` | `contracts` |
| `out` | `out` |
| `script` | `scripts` |
| `libs` | `['node_modules', 'lib']` |
| `test` | `test` |
| `cache_path` | `cache_forge` |
| `solc_version` | Commented out (`# solc-version = "0.8.26"`) — uses auto-detect |
| `optimizer` | `true` |
| `no-match-path` | `test/kontrol/*` |
| `fs_permissions` | `read: ./test/regressions`, `read-write: ./deploy-config`, `read-write: ./deploy-artifacts` |
| `gas_limit` | `18446744073709551615` (u64::MAX) |
| `memory_limit` | `17179869184` (16 GB) |
| `ignored_warnings_from` | `["test/kontrol"]` |

### [profile.kprove]
| Setting | Value |
|---------|-------|
| `src` | `test/kontrol` |
| `out` | `kout` |
| `test` | `test/kontrol` |

Note: This is a Kontrol formal verification profile, not a compiler profile. No Hardhat equivalent needed.

### [fmt]
| Setting | Value |
|---------|-------|
| `line_length` | `120` |
| `multiline_func_header` | `params_first_multi` |

### [lint]
Extensive `exclude_lints` list — Foundry-only feature.

### [etherscan]
| Network | Key | Chain / URL |
|---------|-----|-------------|
| mainnet | `${ETHERSCAN_API_KEY}` | default |
| holesky | `${ETHERSCAN_API_KEY}` | chain 17000 |
| hoodi | `${ETHERSCAN_API_KEY}` | chain 560048, custom URL |

## Remappings (remappings.txt)
- `@openzeppelin/=lib/openzeppelin-contracts/`

## Git submodules (lib/)
| Submodule | Version |
|-----------|---------|
| `forge-std` | v1.9.3 |
| `kontrol-cheatcodes` | 187b89a |
| `openzeppelin-contracts` | v5.0.2 |

All submodules initialized successfully.

## Directory structure
- **Source:** `contracts/` (273 .sol files total excluding node_modules and lib)
- **Tests:** `test/` — subdirectories: `unit/`, `scenario/`, `regressions/`, `kontrol/`, `mocks/`, `utils/`
- **Scripts:** `scripts/` — subdirectories: `deploy/`, `launch/`, `lido-mocks/`, `utils/`, `escrow-upgrade/`, `permissions-transition/`
- **Kontrol tests:** `test/kontrol/` (26 .sol files) — excluded via `no-match-path`
- **Deploy config:** `deploy-config/` (TOML files)
- **Deploy artifacts:** `deploy-artifacts/` (TOML files)

## Test count
- ~921 `function test*` declarations (excluding kontrol)
- Kontrol tests are excluded from forge test via `no-match-path = 'test/kontrol/*'`

## Absolute imports
123 files use absolute imports with these prefixes:
- `contracts/` — main source imports
- `test/` — test utility imports
- `scripts/` — script imports
- `forge-std/` — handled by remapping
- `kontrol-cheatcodes/` — handled by remapping

**Decision:** Use remappings (far more than 10 files).

## Inline test config (`forge-config:`)
**None found.** No files use `/// forge-config:` directives.

## Forge-dependent package.json scripts
| Script | Command | Hardhat equivalent? |
|--------|---------|---------------------|
| `coverage` | `forge coverage` | Yes — `npx hardhat test solidity --coverage` |
| `precov-report` | `forge coverage --report lcov ...` | Yes — built-in `--coverage` generates LCOV |
| `cov-report` | `genhtml ...` on lcov output | Same (post-processing, not Forge-specific) |
| `test` | `forge test` | Yes — `npx hardhat test solidity` |
| `test:unit` | `./commands/run-unit-tests.sh` | Shell script wrapping forge — partial |
| `test:scenario` | `./commands/run-scenario-tests.sh` | Shell script wrapping forge — partial |
| `test:regressions` | `./commands/run-regressions-tests.sh` | Shell script wrapping forge — partial |
| `test:integration` | `./commands/run-integration-tests.sh` | Shell script wrapping forge — partial |
| `test:solvency-simulation` | `./commands/run-solvency-simulation-test.sh` | Shell script wrapping forge — partial |
| `test:complete-rage-quit` | `./commands/run-complete-rage-quit-test.sh` | Shell script wrapping forge — partial |
| `forge:script` | `./commands/run-forge-script.sh` | No equivalent (forge script) |
| `lint-staged` | Uses `forge fmt` | Foundry-only formatter |

## zkSync-specific profiles and contracts
**None.** No zkSync profiles or contracts found.

## Package manager
**npm** — `package-lock.json` exists (2210 lines), `packageManager` field specifies `npm@11.0.0`. No other lockfiles present.

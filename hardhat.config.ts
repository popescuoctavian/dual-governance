import { configVariable, defineConfig } from "hardhat/config";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [hardhatVerify],

  solidity: {
    compilers: [
      {
        version: "0.8.26",
        settings: {
          optimizer: { enabled: true},
          evmVersion: "cancun",
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
  },

  test: {
    solidity: {
      gasLimit: 18446744073709551615n,
      fsPermissions: {
        readDirectory: ["./test/regressions"],
        dangerouslyReadWriteDirectory: [
          "./deploy-config",
          "./deploy-artifacts",
        ],
      },

      // TODO: memory_limit = 17179869184 (16 GB) — no Hardhat equivalent
      // TODO: no-match-path = 'test/kontrol/*' — Hardhat does not support test exclusion patterns.
      //       Kontrol tests will be picked up by Hardhat. Consider moving them out of test/ or
      //       using a hardhat.config.ts override to exclude them.
      // TODO: ignored_warnings_from = ["test/kontrol"] — no Hardhat equivalent
    },
  },

  networks: {
    mainnet: {
      type: "http",
      chainId: 1,
      url: configVariable("MAINNET_RPC_URL"),
    },
    holesky: {
      type: "http",
      chainId: 17000,
      url: configVariable("HOLESKY_RPC_URL"),
    },
    hoodi: {
      type: "http",
      chainId: 560048,
      url: configVariable("HOODI_RPC_URL"),
    },
  },

  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});

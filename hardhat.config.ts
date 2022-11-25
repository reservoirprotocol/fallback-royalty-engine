import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig, NetworkUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  "arbitrum-mainnet": 42161,
  "arbitrum-goerli": 421613,
  avalanche: 43114,
  bsc: 56,
  goerli: 5,
  hardhat: 31337,
  mainnet: 1,
  "optimism-mainnet": 10,
  "polygon-mainnet": 137,
  "polygon-mumbai": 80001,
};

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.MNEMONIC) {
  throw new Error("Please set your MNEMONIC in a .env file");
} else {
  mnemonic = process.env.MNEMONIC;
}

let rpcToken: string;
if (!process.env.RPC_TOKEN) {
  throw new Error("Please set your RPC_TOKEN in a .env file");
} else {
  rpcToken = process.env.RPC_TOKEN;
}

let etherscanApiKey: string;
if (!process.env.ETHERSCAN_API_KEY) {
  throw new Error("Please set your ETHERSCAN_API_KEY in a .env file");
} else {
  etherscanApiKey = process.env.ETHERSCAN_API_KEY;
}

function createConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  const url = `https://${chain}.g.alchemy.com/v2/${rpcToken}`;
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[chain],
    url: url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: 1,
    },
    fork: {
      accounts: {
        mnemonic,
      },
      forking: { url: `https://eth-mainnet.g.alchemy.com/v2/${rpcToken}`, blockNumber: 15632583 },
      chainId: 1,
      url: "http://localhost:8545",
    },
    arbitrumMainnet: createConfig("arbitrum-mainnet"),
    arbitrumGoerli: createConfig("arbitrum-goerli"),
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
  paths: {
    sources: "./src",
    cache: "./cache_hardhat",
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./src",
  },
  solidity: {
    version: "0.8.17",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: "none",
      },
      // You should disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  mocha: {
    timeout: 60000,
  },
};

export default config;

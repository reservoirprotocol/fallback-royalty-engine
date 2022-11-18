# Fallback Royalty Engine

## Motivation

Forward protocol utilizes on-chain royalties, but adoption of on-chain royalties is very low. Around 26% of the top 1000 collections vs 74% on OpenSea.
This would undermine the whole purpose of it if it can just be used to circumvent royalties.

## Features

The fallback engine implements the following features

- Returns the royalty amount as set in the canonical engine if any.
- Allows to store fallback royalty in a compact manner.
- Allows on chain querying of royalties with their fall back.
- Allows self service royalty setting for the provable owner of a collection<sub>\*</sub>.

\* Either the owner of the collection smart contract or an address approved by the fallback engine operator.

## Getting Started

### Pre Requisites

Before being able to run any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. You can follow the example in `.env.example`. If you don't already have a mnemonic, you can use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### Test

Run the tests with Hardhat:

```sh
$ yarn test
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deployment

Deployment is based on the [hardhat deploy plugin](https://github.com/wighawag/hardhat-deploy). All deployment scripts are ready for mainnet and can be found [here](deploy).

**Local Deployment**

```sh
$ yarn node:local
```

and in a different terminal

```sh
$ yarn deploy:local
```

**Testnet Deployment**

```sh
$ yarn hardhat --network goerli deploy
```

**Mainnet Deployment**

```sh
$ yarn hardhat --network mainnet deploy
```

## Operations

### Bulk Royalty Setting

To minimise cost and keep and orderly log of persisted data, we use deployement style scripts. Example [here](deploy/02_set_royalties_0001.ts).
These script are run only once and can be selectively triggered using:

```sh
$ yarn hardhat --tags Operations --network mainnet deploy
```

The royalty setting data is an array of objects with the following schema:

```
{
    collection: address;
    recipients: [address];
    feesInBPS:  [number];
}
```

## License

[MIT](./LICENSE.md) © Reservoir

import { deployments, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import {
  CanonicalRoyaltyEngineMock,
  CanonicalRoyaltyEngineMock__factory,
  IFallbackRoyaltyConfigurable,
  IFallbackRoyaltyConfigurable__factory,
  IRoyaltyEngine,
  IRoyaltyEngine__factory,
  IRoyaltyLookUp,
  IRoyaltyLookUp__factory,
  OwnableMock,
  OwnableMock__factory,
} from "../../typechain";
import { setupUser, setupUsers } from "./users";

export interface Contracts {
  FallbackConfigurable: IFallbackRoyaltyConfigurable;
  FallbackEngine: IRoyaltyEngine;
  RoyaltyLookUp: IRoyaltyLookUp;
  Ownable: OwnableMock;
  CanonicalEngine: CanonicalRoyaltyEngineMock;
}

export interface User extends Contracts {
  address: string;
}

export const setupContracts = deployments.createFixture(async ({ ethers }) => {
  const { deployer } = await getNamedAccounts();
  await deployments.fixture(["Deployment"]);
  const fallback = await deployments.get("DelegatingRoyaltyEngine");
  const signer = (await ethers.getSigners())[0];
  const fallbackConfigurableContract = await IFallbackRoyaltyConfigurable__factory.connect(fallback.address, signer);
  const fallbackengineContract = await IRoyaltyEngine__factory.connect(fallback.address, signer);
  const royaltyLookupContract = await IRoyaltyLookUp__factory.connect(fallback.address, signer);
  const ownableMockAddress = (await deployments.deploy("OwnableMock", { from: deployer })).address;
  const ownableMockContract = await OwnableMock__factory.connect(ownableMockAddress, signer);
  const canonicalRoyaltyEngineMockAddress = (await deployments.deploy("CanonicalRoyaltyEngineMock", { from: deployer }))
    .address;
  const canonicalRoyaltyEngineMockContract = await CanonicalRoyaltyEngineMock__factory.connect(
    canonicalRoyaltyEngineMockAddress,
    signer,
  );

  const contracts: Contracts = {
    FallbackConfigurable: fallbackConfigurableContract,
    FallbackEngine: fallbackengineContract,
    Ownable: ownableMockContract,
    CanonicalEngine: canonicalRoyaltyEngineMockContract,
    RoyaltyLookUp: royaltyLookupContract,
  };

  const users: User[] = await setupUsers(await getUnnamedAccounts(), contracts);

  return {
    contracts,
    deployer: <User>await setupUser(deployer, contracts),
    users,
  };
});

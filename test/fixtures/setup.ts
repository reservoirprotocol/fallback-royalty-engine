import { deployments, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import {
  DelegateRoyaltyEngineMock,
  DelegateRoyaltyEngineMock__factory,
  IFallbackRoyaltyConfigurable,
  IFallbackRoyaltyConfigurable__factory,
  IRoyaltyEngine,
  IRoyaltyEngine__factory,
  OwnableMock,
  OwnableMock__factory,
} from "../../typechain";
import { setupUser, setupUsers } from "./users";

export interface Contracts {
  FallbackConfigurable: IFallbackRoyaltyConfigurable;
  FallbackEngine: IRoyaltyEngine;
  Ownable: OwnableMock;
  Delegate: DelegateRoyaltyEngineMock;
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
  const fallbackEngingContract = await IRoyaltyEngine__factory.connect(fallback.address, signer);
  const ownableMockAddress = (await deployments.deploy("OwnableMock", { from: deployer })).address;
  const ownableMockContract = await OwnableMock__factory.connect(ownableMockAddress, signer);
  const delegateRoyaltyEngineMockAddress = (await deployments.deploy("DelegateRoyaltyEngineMock", { from: deployer }))
    .address;
  const delegateRoyaltyEngineMockContract = await DelegateRoyaltyEngineMock__factory.connect(
    delegateRoyaltyEngineMockAddress,
    signer,
  );

  const contracts: Contracts = {
    FallbackConfigurable: fallbackConfigurableContract,
    FallbackEngine: fallbackEngingContract,
    Ownable: ownableMockContract,
    Delegate: delegateRoyaltyEngineMockContract,
  };

  const users: User[] = await setupUsers(await getUnnamedAccounts(), contracts);

  return {
    contracts,
    deployer: <User>await setupUser(deployer, contracts),
    users,
  };
});

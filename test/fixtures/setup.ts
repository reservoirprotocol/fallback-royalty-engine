import { deployments, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import {
  IFallbackRoyaltyConfigurable,
  IFallbackRoyaltyConfigurable__factory,
  IRoyaltyLookUp,
  IRoyaltyLookUp__factory,
  OwnableMock,
  OwnableMock__factory,
  NonOwnableMock,
  NonOwnableMock__factory,
} from "../../typechain";
import { setupUser, setupUsers } from "./users";

export interface Contracts {
  FallbackConfigurable: IFallbackRoyaltyConfigurable;
  RoyaltyLookUp: IRoyaltyLookUp;
  Ownable: OwnableMock;
  NonOwnable: NonOwnableMock;
}

export interface User extends Contracts {
  address: string;
}

export const setupContracts = deployments.createFixture(async ({ ethers }) => {
  const { deployer } = await getNamedAccounts();
  await deployments.fixture(["Deployment"]);
  const fallback = await deployments.get("FallbackRoyaltyLookUp");
  const signer = (await ethers.getSigners())[0];
  const fallbackConfigurableContract = await IFallbackRoyaltyConfigurable__factory.connect(fallback.address, signer);
  const royaltyLookupContract = await IRoyaltyLookUp__factory.connect(fallback.address, signer);
  const ownableMockAddress = (await deployments.deploy("OwnableMock", { from: deployer })).address;
  const ownableMockContract = await OwnableMock__factory.connect(ownableMockAddress, signer);
  const nonOwnableMockAddress = (await deployments.deploy("NonOwnableMock", { from: deployer })).address;
  const nonOwnableMockContract = await NonOwnableMock__factory.connect(nonOwnableMockAddress, signer);

  const contracts: Contracts = {
    FallbackConfigurable: fallbackConfigurableContract,
    Ownable: ownableMockContract,
    RoyaltyLookUp: royaltyLookupContract,
    NonOwnable: nonOwnableMockContract,
  };

  const users: User[] = await setupUsers(await getUnnamedAccounts(), contracts);

  return {
    contracts,
    deployer: <User>await setupUser(deployer, contracts),
    users,
  };
});

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ROYALTIES_0001 } from "../data/0001_royalties";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { execute } = deployments;

  const { deployer } = await getNamedAccounts();

  if (!ROYALTIES_0001.validated) throw new Error("Royalties not validated yet");

  await execute(
    "DelegatingRoyaltyEngine",
    {
      from: deployer,
      log: true,
    },
    "setRoyalties",
    ROYALTIES_0001.data,
  );

  return true;
};
export default func;
func.id = "SetRoyalties0001";
func.dependencies = ["Deployment"];
func.tags = ["Operations"];

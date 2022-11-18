import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, canonicalEngine } = await getNamedAccounts();

  if (!canonicalEngine) throw new Error("Canonical Engine not defined");

  await deploy("DelegatingRoyaltyEngine", {
    from: deployer,
    log: true,
    args: [canonicalEngine],
  });
  return true;
};

export default func;
func.id = "DelegatingRoyaltyEngineDeployment";
func.tags = ["Deployment"];

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, delegateEngine } = await getNamedAccounts();

  if (!delegateEngine) throw new Error("Delegate Engine not defined");

  await deploy("DelegatingRoyaltyEngine", {
    from: deployer,
    log: true,
    args: [delegateEngine],
  });
  return true;
};

export default func;
func.id = "DelegatingRoyaltyEngineDeployment";
func.tags = ["Deployment"];

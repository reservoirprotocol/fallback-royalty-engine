import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("FallbackRoyaltyLookUp", {
    from: deployer,
    log: true,
  });
  return true;
};

export default func;
func.id = "FallbackRoyaltyLookUpDeployment";
func.tags = ["Deployment"];

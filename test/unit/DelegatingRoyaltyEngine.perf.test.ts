import { constants } from "ethers";
import { Contracts, setupContracts, User } from "../fixtures/setup";
import { autoMining } from "../utils";
import { createRandomRoyalties } from "../utils/data";

describe("Delegating Royalty Engine Performance Tests", function () {
  let deployer: User;
  let users: User[];
  let contracts: Contracts;

  beforeEach(async () => {
    await autoMining();
    ({ deployer, users, contracts } = await setupContracts());
    // We set the delegate ad hoc in test cases
    await deployer.FallbackConfigurable.setDelegateEngine(constants.AddressZero);
  });

  describe("Populating Royalties", async function () {
    it("sets many royalties", async function () {
      const numberOfRoyalties = 1000;
      const royalties = createRandomRoyalties(numberOfRoyalties, 1);
      await deployer.FallbackConfigurable.setRoyalties(royalties);
    });
  });
});

import { setupContracts, User } from "../fixtures/setup";
import { autoMining } from "../utils";
import { createRandomRoyalties } from "../utils/data";

describe("Delegating Royalty Engine Performance Tests", function () {
  let deployer: User;

  beforeEach(async () => {
    await autoMining();
    ({ deployer } = await setupContracts());
  });

  describe("Populating Royalties", async function () {
    it("sets many royalties", async function () {
      const numberOfRoyalties = 1000;
      const royalties = createRandomRoyalties(numberOfRoyalties, 1);
      await deployer.FallbackConfigurable.setRoyalties(royalties);
    });
  });
});

import { expect } from "chai";
import { BigNumber, BigNumberish, constants } from "ethers";
import { Contracts, setupContracts, User } from "../fixtures/setup";
import { autoMining, A_NON_ZERO_ADDRESS } from "../utils";
import { createRandomRoyalties } from "../utils/data";
import { bigN, ETH } from "../../utils";

describe("Fallback Royalty Look Up Tests", function () {
  let deployer: User;
  let users: User[];
  let contracts: Contracts;

  beforeEach(async () => {
    await autoMining();
    ({ deployer, users, contracts } = await setupContracts());
  });

  describe("ACL", async function () {
    it("forbids non owner to set royalties", async function () {
      await expect(users[1].FallbackConfigurable.setRoyalties(createRandomRoyalties(1))).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("forbids non owner to set canonical collection admin", async function () {
      await expect(
        users[1].FallbackConfigurable.setCollectionAdmin(A_NON_ZERO_ADDRESS, A_NON_ZERO_ADDRESS),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("forbids non collection admin to set royalty", async function () {
      await expect(
        users[1].FallbackConfigurable.setRoyaltyEntryWithCollectionAdmin(createRandomRoyalties(1)[0]),
      ).to.be.revertedWithCustomError(contracts.FallbackConfigurable, "NotCollectionAdmin");
    });
  });

  describe("Royalties fallback", async function () {
    it("reverts with mismatched royalty", async function () {
      const royalties = createRandomRoyalties(1);
      royalties[0].feesInBPS.pop();
      await expect(deployer.FallbackConfigurable.setRoyalties(royalties)).to.be.revertedWithCustomError(
        contracts.FallbackConfigurable,
        "IllegalRoyaltyEntry",
      );
    });

    it("reverts with invalid royalty amount", async function () {
      const royalties = createRandomRoyalties(1, 2);
      royalties[0].feesInBPS[0] = 5000;
      royalties[0].feesInBPS[1] = 5000;
      await expect(deployer.FallbackConfigurable.setRoyalties(royalties)).to.be.revertedWithCustomError(
        contracts.FallbackConfigurable,
        "InvalidRoyaltyAmount",
      );
    });

    it("reverts with too many recipients", async function () {
      const royalties = createRandomRoyalties(1, 257);
      await expect(deployer.FallbackConfigurable.setRoyalties(royalties)).to.be.revertedWithCustomError(
        contracts.FallbackConfigurable,
        "IllegalRoyaltyEntry",
      );
    });

    it("allows owner to set singleton royalty", async function () {
      const royalties = createRandomRoyalties(1);
      await deployer.FallbackConfigurable.setRoyalties(royalties);
      const royalty = await contracts.RoyaltyLookUp.getRoyalties(royalties[0].collection, 0);
      expect(royalty.recipients).to.be.eql(royalties[0].recipients);
      expect(royalty.feesInBPS).to.be.eql(royalties[0].feesInBPS);
    });

    it("allows collection admin to set royalty", async function () {
      const royalties = createRandomRoyalties(1);
      royalties[0].collection = contracts.NonOwnable.address; //We just need any non ownable contract for this use case
      await deployer.FallbackConfigurable.setCollectionAdmin(royalties[0].collection, users[1].address);
      await users[1].FallbackConfigurable.setRoyaltyEntryWithCollectionAdmin(royalties[0]);
      const royalty = await contracts.RoyaltyLookUp.getRoyalties(royalties[0].collection, 0);
      expect(royalty.recipients).to.be.eql(royalties[0].recipients);
      expect(royalty.feesInBPS).to.be.eql(royalties[0].feesInBPS);
    });

    it("allows collection owner to set royalty", async function () {
      await deployer.Ownable.transferOwnership(users[1].address);
      const royalties = createRandomRoyalties(1);
      royalties[0].collection = contracts.Ownable.address;
      await users[1].FallbackConfigurable.setRoyaltyEntryWithCollectionAdmin(royalties[0]);
      const royalty = await contracts.RoyaltyLookUp.getRoyalties(royalties[0].collection, 0);
      expect(royalty.recipients).to.be.eql(royalties[0].recipients);
      expect(royalty.feesInBPS).to.be.eql(royalties[0].feesInBPS);
    });

    it("allows owner to set multiple royalties", async function () {
      const numberOfRoyalties = 10;
      const royalties = createRandomRoyalties(numberOfRoyalties);
      await deployer.FallbackConfigurable.setRoyalties(royalties);
      for (let i = 0; i < numberOfRoyalties; i++) {
        const royalty = await contracts.RoyaltyLookUp.getRoyalties(royalties[i].collection, 0);
        expect(royalty.recipients).to.be.eql(royalties[i].recipients);
        expect(royalty.feesInBPS).to.be.eql(royalties[i].feesInBPS);
      }
    });

    it("overrides royalty with one with fewer recipients", async function () {
      const longerRoyalty = createRandomRoyalties(1, 10);
      await deployer.FallbackConfigurable.setRoyalties(longerRoyalty);
      const shorterRoyalty = createRandomRoyalties(1, 5);
      shorterRoyalty[0].collection = longerRoyalty[0].collection;
      await deployer.FallbackConfigurable.setRoyalties(shorterRoyalty);
      const royalty = await contracts.RoyaltyLookUp.getRoyalties(shorterRoyalty[0].collection, 0);
      expect(royalty.recipients).to.be.eql(shorterRoyalty[0].recipients);
      expect(royalty.feesInBPS).to.be.eql(shorterRoyalty[0].feesInBPS);
    });

    it("overrides royalty with one with more recipients", async function () {
      const shorterRoyalty = createRandomRoyalties(1, 5);
      await deployer.FallbackConfigurable.setRoyalties(shorterRoyalty);
      const longerRoyalty = createRandomRoyalties(1, 10);
      longerRoyalty[0].collection = shorterRoyalty[0].collection;
      await deployer.FallbackConfigurable.setRoyalties(longerRoyalty);
      const royalty = await contracts.RoyaltyLookUp.getRoyalties(longerRoyalty[0].collection, 0);
      expect(royalty.recipients).to.be.eql(longerRoyalty[0].recipients);
      expect(royalty.feesInBPS).to.be.eql(longerRoyalty[0].feesInBPS);
    });

    it("deletes royalty with no recipients", async function () {
      const longerRoyalty = createRandomRoyalties(1, 10);
      await deployer.FallbackConfigurable.setRoyalties(longerRoyalty);
      const shorterRoyalty = { collection: longerRoyalty[0].collection, recipients: [], feesInBPS: [] };
      await deployer.FallbackConfigurable.setRoyalties([shorterRoyalty]);
      const royalty = await contracts.RoyaltyLookUp.getRoyalties(shorterRoyalty.collection, 0);
      expect(royalty.recipients).to.be.eql([]);
      expect(royalty.feesInBPS).to.be.eql([]);
    });
  });

  describe("Royalties Retrieval", async function () {
    it("returns empty royalties if not found", async function () {
      const royaltiesFallback = createRandomRoyalties(1);
      const royalty = await contracts.RoyaltyLookUp.getRoyalties(royaltiesFallback[0].collection, 0);
      expect(royalty.recipients).to.be.empty;
      expect(royalty.feesInBPS).to.be.empty;
    });

    it("retrieves the correct royalties", async function () {
      const numberOfRecipients = 10;
      const royalties = createRandomRoyalties(1, numberOfRecipients);
      await deployer.FallbackConfigurable.setRoyalties(royalties);

      const royalty = await contracts.RoyaltyLookUp.getRoyalties(royalties[0].collection, 0);
      expect(royalty.recipients).to.be.eql(royalties[0].recipients);
      for (let i = 0; i < numberOfRecipients; i++) {
        expect(royalty.feesInBPS[i]).to.be.eql(bigN(royalties[0].feesInBPS[i] as BigNumberish));
      }
    });
  });
});

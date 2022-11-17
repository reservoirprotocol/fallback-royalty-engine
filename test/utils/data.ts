import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { IFallbackRoyaltyConfigurable } from "../../typechain";

export const A_NON_ZERO_ADDRESS = "0x1234000000000000000000000000000000000000";
export const SECONDS_IN_A_DAY = 24 * 60 * 60;

export function createRandomRoyalties(
  howMany: number,
  numberOfRecipients?: number,
): IFallbackRoyaltyConfigurable.RoyaltyEntryInputStruct[] {
  const royalties = [];
  for (let i = 0; i < howMany; i++) {
    numberOfRecipients = numberOfRecipients || randomInteger(1, 10);
    const recipients = [];
    const feesInBPS = [];
    for (let j = 0; j < numberOfRecipients; j++) {
      recipients.push(ethers.Wallet.createRandom().address);
      feesInBPS.push(BigNumber.from(randomInteger(0, 1000)));
    }
    royalties.push({ collection: ethers.Wallet.createRandom().address, recipients, feesInBPS });
  }
  return royalties;
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

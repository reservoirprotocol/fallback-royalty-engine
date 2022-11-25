// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/** 
 * @title Fallback Royalty Look Up
 * @author Tony Snark
 * @notice This interface represent a type of contracts which allow to have a fallback value for when 
           royalty setting are not found on chain in the canonical Royalty engine (see https://royaltyregistry.xyz/).
           Typically royalty values will be gathered from Opensea offchain APIs.
 */
interface IFallbackRoyaltyConfigurable {
    error IllegalRoyaltyEntry();
    error InvalidRoyaltyAmount();
    error NotCollectionAdmin();

    event CollectionAdminUpdated(address indexed collection, address indexed admin);
    event FallbackRoyaltiesUpdated(address indexed collection, address payable[] recipients, uint16[] feesInBPS);

    struct RoyaltyEntryInput {
        address collection;
        address payable[] recipients;
        uint16[] feesInBPS;
    }

    /**
     * @notice Sets fallback royalties in batches overriding previous values.
     * @dev This should be a permissioned function called by the engine owner
     * @param royalties A batch of royalties settings
     */
    function setRoyalties(RoyaltyEntryInput[] calldata royalties) external;

    /**
     * @notice Allows a collection admin to set a fallback royalty for the collection
     * @dev This should be a permissioned function called by the collection admin
     * @param royalty New royalty settings for a collection
     */
    function setRoyaltyEntryWithCollectionAdmin(RoyaltyEntryInput calldata royalty) external;

    /**
     * @notice Sets the admin for a collection if the collection is not 'Ownable'
     * @dev This should be a permissioned function called by the engine owner
     * @param collection Collection for which setting the admin
     * @param admin Collection's admin address
     */
    function setCollectionAdmin(address collection, address admin) external;
}

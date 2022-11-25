// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { IFallbackRoyaltyConfigurable } from "./IFallbackRoyaltyConfigurable.sol";
import { IRoyaltyLookUp } from "./IRoyaltyLookUp.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/** 
 * @title Fallback Royalty Look Up
 * @author Tony Snark
 * @dev This implementation uses a compact royalty setting representation optimised for 
        single recipient cases. The data structure is based on a primary entry that is 
        assumed always present when the royalty is set. This entry maintains the updated
        total number of recipients. Recipients are kept in a flat mapping where the mapping 
        keys are derived deterministically by concatenating the collection address bits and  
        the recipient index in the recipient list:
        
        Recipient Key = | Collection address bits | Recipient index bits |

        Where the recipient index of the primary recipient is 0.
 */
contract FallbackRoyaltyLookUp is IFallbackRoyaltyConfigurable, IRoyaltyLookUp, Ownable {
    using Address for address;

    uint256 private constant BPS_DENOMINATOR = 10000;

    struct RoyaltyEntry {
        address payable recipient;
        uint16 feesInBPS;
        uint8 numberOfRecipients;
    }

    mapping(uint256 => RoyaltyEntry) private _royaltyByRecipientId;
    /// @dev We leave this public for offchain look-ups
    mapping(address => address) public collectionAdmins;

    /// @inheritdoc IFallbackRoyaltyConfigurable
    function setCollectionAdmin(address collection, address admin) external onlyOwner {
        collectionAdmins[collection] = admin;
        emit CollectionAdminUpdated(collection, admin);
    }

    /// @inheritdoc IFallbackRoyaltyConfigurable
    function setRoyalties(RoyaltyEntryInput[] calldata royalties) external onlyOwner {
        uint256 length = royalties.length;

        for (uint256 i; i < length; ) {
            _setRoyaltyEntry(royalties[i]);
            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IFallbackRoyaltyConfigurable
    function setRoyaltyEntryWithCollectionAdmin(RoyaltyEntryInput calldata royalties) external {
        if (_resolveCollectionAdmin(royalties.collection) != msg.sender) revert NotCollectionAdmin();
        _setRoyaltyEntry(royalties);
    }

    /// @dev Collection ownership has precedence on override
    function _resolveCollectionAdmin(address collection) internal view returns (address admin) {
        if (collection.isContract()) {
            try Ownable(collection).owner() returns (address owner) {
                admin = owner;
            } catch {
                admin = collectionAdmins[collection];
            }
        }
    }

    /// @dev Royalty setting is idempotent and it overrides all previous settings for a collection
    ///      Deletion is implemented by passing a royalty with no recipients.
    function _setRoyaltyEntry(RoyaltyEntryInput calldata royalty) private {
        address collection = royalty.collection;
        address payable[] calldata recipients = royalty.recipients;
        uint16[] calldata feesInBPS = royalty.feesInBPS;
        uint256 numberOfRecipients = recipients.length;
        uint256 collectionId = uint256(uint160(collection)) << 8;
        // Delete royalty if no recipient set
        if (numberOfRecipients == 0) {
            delete _royaltyByRecipientId[collectionId];
            return;
        }
        if (numberOfRecipients != feesInBPS.length || numberOfRecipients > type(uint8).max)
            revert IllegalRoyaltyEntry();
        uint256 totalBPS = feesInBPS[0];
        _royaltyByRecipientId[collectionId] = RoyaltyEntry(recipients[0], feesInBPS[0], uint8(numberOfRecipients));

        for (uint256 i = 1; i < numberOfRecipients; ) {
            _royaltyByRecipientId[collectionId | i] = RoyaltyEntry(
                recipients[i],
                feesInBPS[i],
                0 // Ignored
            );
            unchecked {
                totalBPS += feesInBPS[i]; //It cannot overflow: addends are 16 bits in a 256 bits accumulator
                ++i;
            }
        }

        if (totalBPS >= BPS_DENOMINATOR) revert InvalidRoyaltyAmount();
        emit FallbackRoyaltiesUpdated(collection, recipients, feesInBPS);
    }

    ///@inheritdoc IRoyaltyLookUp
    function getRoyalties(address tokenAddress, uint256)
        external
        view
        override
        returns (address payable[] memory recipients, uint256[] memory feesInBPS)
    {
        uint256 collectionId = uint256(uint160(tokenAddress)) << 8;
        RoyaltyEntry memory entry = _royaltyByRecipientId[collectionId];
        if (entry.recipient != address(0)) {
            uint8 numberOfRecipients = entry.numberOfRecipients;
            recipients = new address payable[](numberOfRecipients);
            feesInBPS = new uint256[](numberOfRecipients);
            recipients[0] = payable(entry.recipient);
            feesInBPS[0] = entry.feesInBPS;
            for (uint256 i = 1; i < numberOfRecipients; ) {
                entry = _royaltyByRecipientId[collectionId | i];
                recipients[i] = payable(entry.recipient);
                feesInBPS[i] = entry.feesInBPS;
                unchecked {
                    ++i;
                }
            }
        }
    }
}

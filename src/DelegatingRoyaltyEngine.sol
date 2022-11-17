// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { IRoyaltyEngine } from "./IRoyaltyEngine.sol";
import { IFallbackRoyaltyConfigurable } from "./IFallbackRoyaltyConfigurable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

contract DelegatingRoyaltyEngine is IRoyaltyEngine, IFallbackRoyaltyConfigurable, Ownable {
    using Address for address;

    struct RoyaltyEntry {
        address recipient;
        uint16 feesInBPS;
        uint8 numberOfRecipients;
    }

    IRoyaltyEngine private _delegate;
    mapping(uint256 => RoyaltyEntry) private _royaltyByRecipientId;
    mapping(address => address) public collectionAdmins;

    constructor(IRoyaltyEngine delegate_) {
        setDelegateEngine(delegate_);
    }

    function setDelegateEngine(IRoyaltyEngine delegate_) public onlyOwner {
        emit DelegateEngineUpdated(_delegate, delegate_);
        _delegate = delegate_;
    }

    function setCollectionAdmin(address collection, address admin) external onlyOwner {
        collectionAdmins[collection] = admin;
        emit CollectionAdminUpdated(collection, admin);
    }

    function setRoyalties(RoyaltyEntryInput[] calldata royalties) external onlyOwner {
        uint256 length = royalties.length;
        for (uint256 i; i < length; i++) {
            _setRoyaltyEntry(royalties[i]);
        }
    }

    function setRoyaltyEntryWithCollectionAdmin(RoyaltyEntryInput calldata royalties) external {
        if (_resolveCollectionAdmin(royalties.collection) != msg.sender) revert NotCollectionAdmin();
        _setRoyaltyEntry(royalties);
    }

    function _resolveCollectionAdmin(address collection) internal view returns (address admin) {
        admin = collectionAdmins[collection];
        if (admin == address(0) && collection.isContract()) {
            try Ownable(collection).owner() returns (address owner) {
                admin = owner;
                // solhint-disable no-empty-blocks
            } catch {}
        }
    }

    function _setRoyaltyEntry(RoyaltyEntryInput calldata royalty) private {
        address collection = royalty.collection;
        address[] calldata recipients = royalty.recipients;
        uint16[] calldata feesInBPS = royalty.feesInBPS;
        uint256 numberOfRecipients = recipients.length;
        // Delete royalty if no recipient set
        if (numberOfRecipients == 0) {
            delete _royaltyByRecipientId[uint256(uint160(collection)) << 8];
            return;
        }
        if (numberOfRecipients != feesInBPS.length || numberOfRecipients > type(uint8).max)
            revert IllegalRoyaltyEntry();

        _royaltyByRecipientId[uint256(uint160(collection)) << 8] = RoyaltyEntry(
            recipients[0],
            feesInBPS[0],
            uint8(numberOfRecipients)
        );

        for (uint256 i = 1; i < numberOfRecipients; ) {
            _royaltyByRecipientId[(uint256(uint160(collection)) << 8) | i] = RoyaltyEntry(
                recipients[i],
                feesInBPS[i],
                0 // Ignored
            );
            unchecked {
                ++i;
            }
        }
        emit FallbackRoyaltiesUpdated(collection, recipients, feesInBPS);
    }

    function getRoyaltyView(
        address collection,
        uint256 tokenId,
        uint256 value
    ) external view returns (address[] memory recipients, uint256[] memory amounts) {
        if (address(_delegate) > address(0)) {
            (recipients, amounts) = _delegate.getRoyaltyView(collection, tokenId, value);
        }
        if (recipients.length < 1) {
            RoyaltyEntry memory entry = _royaltyByRecipientId[uint256(uint160(collection)) << 8];
            if (entry.recipient != address(0)) {
                uint8 numberOfRecipients = entry.numberOfRecipients;
                recipients = new address[](numberOfRecipients);
                amounts = new uint256[](numberOfRecipients);
                recipients[0] = entry.recipient;
                amounts[0] = (entry.feesInBPS * value) / 10000;
                for (uint256 i = 1; i < numberOfRecipients; ) {
                    entry = _royaltyByRecipientId[(uint256(uint160(collection)) << 8) | i];
                    recipients[i] = entry.recipient;
                    amounts[i] = (entry.feesInBPS * value) / 10000;
                    unchecked {
                        ++i;
                    }
                }
            }
        }
    }
}

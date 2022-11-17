// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { IRoyaltyEngine } from "./IRoyaltyEngine.sol";

interface IFallbackRoyaltyConfigurable {
    error IllegalRoyaltyEntry();
    error NotCollectionAdmin();

    event DelegateEngineUpdated(IRoyaltyEngine indexed previousEngine, IRoyaltyEngine indexed newEngine);
    event CollectionAdminUpdated(address indexed collection, address indexed admin);
    event FallbackRoyaltiesUpdated(address indexed collection, address[] recipients, uint16[] feesInBPS);

    struct RoyaltyEntryInput {
        address collection;
        address[] recipients;
        uint16[] feesInBPS;
    }

    function setRoyalties(RoyaltyEntryInput[] calldata royalties) external;

    function setRoyaltyEntryWithCollectionAdmin(RoyaltyEntryInput calldata royalties) external;

    function setDelegateEngine(IRoyaltyEngine delegate) external;

    function setCollectionAdmin(address collection, address admin) external;
}

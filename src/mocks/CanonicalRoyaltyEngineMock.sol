// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IRoyaltyEngine } from "../IRoyaltyEngine.sol";

contract CanonicalRoyaltyEngineMock is IRoyaltyEngine {
    address payable[] private _recipients;
    uint256[] private _amounts;

    function setResponse(address payable[] calldata recipients_, uint256[] calldata amounts_) external {
        _recipients = recipients_;
        _amounts = amounts_;
    }

    function getRoyaltyView(
        address,
        uint256,
        uint256
    ) external view returns (address payable[] memory recipients, uint256[] memory amounts) {
        recipients = _recipients;
        amounts = _amounts;
    }
}

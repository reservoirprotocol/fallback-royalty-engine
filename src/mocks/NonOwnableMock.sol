// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract NonOwnableMock {
    function nonOwner() external view returns (address) {
        return address(this);
    }
}

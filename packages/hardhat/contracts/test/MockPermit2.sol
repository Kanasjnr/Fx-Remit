// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPermit2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockPermit2 is IPermit2 {
    using SafeERC20 for IERC20;
    
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    mapping(address => uint256) public nonces;
    
    function permitTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata /* signature */
    ) external override {
        require(block.timestamp <= permit.deadline, "Expired");
        require(!usedNonces[owner][permit.nonce], "Nonce already used");
        
        usedNonces[owner][permit.nonce] = true;
        nonces[owner]++;
        
        require(permit.permitted.amount >= transferDetails.requestedAmount, "Invalid permit");
        
        IERC20(permit.permitted.token).safeTransferFrom(
            owner,
            transferDetails.to,
            transferDetails.requestedAmount
        );
    }
    
    function permitTransferFrom(
        PermitBatchTransferFrom memory /* permit */,
        SignatureTransferDetails[] calldata /* transferDetails */,
        address /* owner */,
        bytes calldata /* signature */
    ) external pure override {
        revert("Batch not implemented in mock");
    }
}


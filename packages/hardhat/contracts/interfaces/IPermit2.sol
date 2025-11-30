// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPermit2
 * @dev Interface for Uniswap's Permit2 contract
 * @notice Universal signature-based token approvals
 */
interface IPermit2 {
    struct TokenPermissions {
        address token;
        uint256 amount;
    }
    
    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }
    
    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }
    
    /**
     * @dev Transfer tokens using a signature
     * @param permit The permit data signed by the user
     * @param transferDetails Where to transfer and how much
     * @param owner The token owner (signer)
     * @param signature The signature authorizing the transfer
     */
    function permitTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;
    
    /**
     * @dev Batch version for multiple tokens
     */
    struct PermitBatchTransferFrom {
        TokenPermissions[] permitted;
        uint256 nonce;
        uint256 deadline;
    }
    
    function permitTransferFrom(
        PermitBatchTransferFrom memory permit,
        SignatureTransferDetails[] calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;
}


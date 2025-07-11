// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./constants/MentoTokens.sol";

/**
 * @title FXRemit
 * @dev Contract for logging and tracking cross-border remittances via Mento Protocol
 * @notice This contract tracks remittance transactions for analytics and user history
 */
contract FXRemit is ReentrancyGuard, Ownable, Pausable {
    
    // ===== DATA STRUCTURES =====
    
    struct Remittance {
        uint256 id;
        address sender;
        address recipient;
        address fromToken;          // Token contract address (e.g., cUSD contract)
        address toToken;            // Token contract address (e.g., cKES contract)
        string fromCurrency;        // "cUSD" (for display)
        string toCurrency;          // "cKES" (for display)
        uint256 amountSent;         // Amount sent (in wei)
        uint256 amountReceived;     // Amount received (in wei)
        uint256 exchangeRate;       // Rate used (scaled by 1e18)
        uint256 platformFee;        // Our revenue (in wei)
        uint256 timestamp;
        bytes32 mentoTxHash;        // Mento transaction hash
        string corridor;            // "USD-KES"
    }
    
    // ===== STORAGE =====
    
    mapping(uint256 => Remittance) public remittances;
    mapping(address => uint256[]) public userRemittances;
    mapping(string => uint256) public corridorVolume;
    mapping(bytes32 => bool) public processedTxs;
    
    uint256 public nextRemittanceId = 1;
    uint256 public totalVolume;
    uint256 public totalFees;
    uint256 public totalTransactions;
    
    // ===== EVENTS =====
    
    event RemittanceLogged(
        uint256 indexed remittanceId,
        address indexed sender,
        address indexed recipient,
        string fromCurrency,
        string toCurrency,
        uint256 amountSent,
        uint256 amountReceived,
        string corridor
    );
    
    event PlatformStatsUpdated(
        uint256 totalVolume,
        uint256 totalFees,
        uint256 totalTransactions
    );
    
    event FeesWithdrawn(address indexed to, uint256 amount);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    
    // ===== CONSTRUCTOR =====
    
    constructor() Ownable(msg.sender) {
        // Contract is ready to use immediately after deployment
        // msg.sender becomes the initial owner
    }
    
    // ===== MAIN FUNCTIONS =====
    
    /**
     * @dev Log a completed remittance transaction
     * @param recipient Address receiving the funds
     * @param fromToken Source token contract address
     * @param toToken Destination token contract address
     * @param fromCurrency Source currency (e.g., "cUSD")
     * @param toCurrency Destination currency (e.g., "cKES")
     * @param amountSent Amount sent by sender
     * @param amountReceived Amount received by recipient
     * @param exchangeRate Exchange rate used (scaled by 1e18)
     * @param platformFee Fee collected by platform
     * @param mentoTxHash Mento protocol transaction hash
     * @param corridor Trading corridor (e.g., "USD-KES")
     * @return remittanceId Unique ID for this remittance
     */
    function logRemittance(
        address recipient,
        address fromToken,
        address toToken,
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amountSent,
        uint256 amountReceived,
        uint256 exchangeRate,
        uint256 platformFee,
        bytes32 mentoTxHash,
        string memory corridor
    ) external nonReentrant whenNotPaused returns (uint256) {
        
        require(recipient != address(0), "Invalid recipient address");
        require(fromToken != address(0), "Invalid from token address");
        require(toToken != address(0), "Invalid to token address");
        require(fromToken != toToken, "From and to tokens must be different");
        
        // Validate tokens are supported by Mento Protocol
        require(MentoTokens.isSupportedToken(fromToken), "From token not supported by Mento Protocol");
        require(MentoTokens.isSupportedToken(toToken), "To token not supported by Mento Protocol");
        
        require(amountSent > 0, "Amount sent must be greater than 0");
        require(amountReceived > 0, "Amount received must be greater than 0");
        require(bytes(fromCurrency).length > 0 && bytes(fromCurrency).length <= 10, "Invalid from currency length");
        require(bytes(toCurrency).length > 0 && bytes(toCurrency).length <= 10, "Invalid to currency length");
        require(bytes(corridor).length > 0 && bytes(corridor).length <= 20, "Invalid corridor length");
        require(!processedTxs[mentoTxHash], "Transaction already processed");
        
        uint256 remittanceId = nextRemittanceId++;
        
        remittances[remittanceId] = Remittance({
            id: remittanceId,
            sender: msg.sender,
            recipient: recipient,
            fromToken: fromToken,
            toToken: toToken,
            fromCurrency: fromCurrency,
            toCurrency: toCurrency,
            amountSent: amountSent,
            amountReceived: amountReceived,
            exchangeRate: exchangeRate,
            platformFee: platformFee,
            timestamp: block.timestamp,
            mentoTxHash: mentoTxHash,
            corridor: corridor
        });
        
        // Update user history
        userRemittances[msg.sender].push(remittanceId);
        
        // Update analytics
        corridorVolume[corridor] += amountSent;
        totalVolume += amountSent;
        totalFees += platformFee;
        totalTransactions++;
        
        // Mark transaction as processed
        processedTxs[mentoTxHash] = true;
        
        emit RemittanceLogged(
            remittanceId,
            msg.sender,
            recipient,
            fromCurrency,
            toCurrency,
            amountSent,
            amountReceived,
            corridor
        );
        
        emit PlatformStatsUpdated(totalVolume, totalFees, totalTransactions);
        
        return remittanceId;
    }
    
    // ===== VIEW FUNCTIONS =====
    
    /**
     * @dev Get details of a specific remittance
     * @param remittanceId ID of the remittance
     * @return Remittance struct with all details
     */
    function getRemittance(uint256 remittanceId) 
        external view returns (Remittance memory) {
        require(remittanceId > 0 && remittanceId < nextRemittanceId, "Invalid remittance ID");
        return remittances[remittanceId];
    }
    
    /**
     * @dev Get all remittance IDs for a specific user
     * @param user Address of the user
     * @return Array of remittance IDs
     */
    function getUserRemittances(address user) 
        external view returns (uint256[] memory) {
        return userRemittances[user];
    }
    
    /**
     * @dev Get count of remittances for a user
     * @param user Address of the user
     * @return Number of remittances
     */
    function getUserRemittanceCount(address user) 
        external view returns (uint256) {
        return userRemittances[user].length;
    }
    
    /**
     * @dev Get total volume for a specific corridor
     * @param corridor Trading corridor (e.g., "USD-KES")
     * @return Total volume in wei
     */
    function getCorridorVolume(string memory corridor) 
        external view returns (uint256) {
        return corridorVolume[corridor];
    }
    
    /**
     * @dev Get platform-wide statistics
     * @return _totalVolume Total volume across all corridors
     * @return _totalFees Total fees collected
     * @return _totalTransactions Total number of transactions
     * @return _totalRemittances Total number of remittances
     */
    function getPlatformStats() external view returns (
        uint256 _totalVolume,
        uint256 _totalFees,
        uint256 _totalTransactions,
        uint256 _totalRemittances
    ) {
        return (totalVolume, totalFees, totalTransactions, nextRemittanceId - 1);
    }
    
    /**
     * @dev Get statistics for a specific user (with DOS protection)
     * @param user Address of the user
     * @param maxTransactions Maximum transactions to process (DOS protection)
     * @return userTotalSent Total amount sent by user (partial if limited)
     * @return userTransactionsProcessed Number of transactions processed
     * @return userTotalFees Total fees paid by user (partial if limited)
     * @return totalUserTransactions Total transactions user has (full count)
     */
    function getUserStats(address user, uint256 maxTransactions) external view returns (
        uint256 userTotalSent,
        uint256 userTransactionsProcessed,
        uint256 userTotalFees,
        uint256 totalUserTransactions
    ) {
        require(maxTransactions > 0 && maxTransactions <= 100, "Invalid limit: 1-100 allowed");
        
        uint256[] memory userTxs = userRemittances[user];
        uint256 totalSent = 0;
        uint256 totalUserFees = 0;
        
        uint256 limit = userTxs.length < maxTransactions ? userTxs.length : maxTransactions;
        
        for (uint256 i = 0; i < limit; i++) {
            Remittance memory remittance = remittances[userTxs[i]];
            totalSent += remittance.amountSent;
            totalUserFees += remittance.platformFee;
        }
        
        return (totalSent, limit, totalUserFees, userTxs.length);
    }
    
    /**
     * @dev Get most recent remittances
     * @param limit Maximum number of remittances to return
     * @return Array of recent remittance IDs
     */
    function getRecentRemittances(uint256 limit) 
        external view returns (uint256[] memory) {
        require(limit > 0 && limit <= 100, "Invalid limit: 1-100 allowed");
        
        uint256 totalRemittances = nextRemittanceId - 1;
        uint256 resultLength = limit > totalRemittances ? totalRemittances : limit;
        uint256[] memory result = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = totalRemittances - i;
        }
        
        return result;
    }
    
    /**
     * @dev Check if a Mento transaction has been processed
     * @param mentoTxHash Mento transaction hash
     * @return true if already processed, false otherwise
     */
    function isTransactionProcessed(bytes32 mentoTxHash) 
        external view returns (bool) {
        return processedTxs[mentoTxHash];
    }
    
    /**
     * @dev Check if a token is supported by Mento Protocol
     * @param token Token contract address
     * @return true if supported, false otherwise
     */
    function isSupportedToken(address token) 
        external pure returns (bool) {
        return MentoTokens.isSupportedToken(token);
    }
    
    /**
     * @dev Get token symbol from contract address
     * @param token Token contract address
     * @return Token symbol (e.g., "cUSD", "cKES")
     */
    function getTokenSymbol(address token) 
        external pure returns (string memory) {
        return MentoTokens.getTokenSymbol(token);
    }
    
    // ===== ADMIN FUNCTIONS =====
    
    /**
     * @dev Withdraw accumulated fees (if any)
     * @param to Address to send fees to
     */
    function withdrawFees(address payable to) external onlyOwner {
        require(to != address(0), "Invalid withdrawal address");
        require(address(this).balance > 0, "No fees to withdraw");
        uint256 balance = address(this).balance;
        to.transfer(balance);
        
        emit FeesWithdrawn(to, balance);
    }
    
    /**
     * @dev Pause the contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }
    
    /**
     * @dev Unpause the contract after emergency is resolved
     */
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
    
    // ===== RECEIVE FUNCTIONS =====
    
    /**
     * @dev Allow contract to receive ETH for fees
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {}
} 
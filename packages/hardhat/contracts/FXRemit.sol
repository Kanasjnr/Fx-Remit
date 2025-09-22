// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./constants/MentoTokens.sol";
import "./interfaces/IMentoBroker.sol";

/**
 * @title FXRemit
 * @dev Contract for logging and tracking cross-border remittances via Mento Protocol
 * @notice This contract tracks remittance transactions for analytics and user history
 */
contract FXRemit is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
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
    
    // Broker and fees
    address public mentoBroker; // Mento Broker contract
    uint16 public feeBps = 150; // 1.5% default
    
    // Provider allowlist
    mapping(address => bool) public allowedProviders;

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
    
    event SwapExecuted(
        uint256 indexed remittanceId,
        address providerAddr,
        bytes32 exchangeId,
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event TokensTransferred(
        uint256 indexed remittanceId,
        address indexed token,
        address indexed to,
        uint256 amount
    );
    
    event BrokerUpdated(address indexed broker);
    event FeeBpsUpdated(uint16 feeBps);
    event ProviderAllowed(address indexed provider, bool allowed);

    // ===== CONSTRUCTOR =====
    
    constructor() Ownable(msg.sender) {
        // Contract is ready to use immediately after deployment
        // msg.sender becomes the initial owner
    }
    
    // ===== MAIN FUNCTIONS =====
    
    /**
     * @dev Perform swap via Mento Broker and send to recipient, then log remittance
     */
    function swapAndSend(
        address recipient,
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        string memory fromCurrency,
        string memory toCurrency,
        string memory corridor,
        address providerAddr,
        bytes32 exchangeId,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 remittanceId, uint256 amountOut) {
        require(block.timestamp <= deadline, "Expired");
        require(mentoBroker != address(0), "Broker not set");
        require(recipient != address(0), "Invalid recipient address");
        require(providerAddr != address(0), "Invalid provider");
        require(allowedProviders[providerAddr], "Provider not allowed");
        require(fromToken != address(0) && toToken != address(0), "Invalid token");
        require(fromToken != toToken, "Tokens must differ");
        require(MentoTokens.isSupportedToken(fromToken), "From token unsupported");
        require(MentoTokens.isSupportedToken(toToken), "To token unsupported");
        require(amountIn > 0, "amountIn = 0");
        require(minAmountOut > 0, "minOut = 0");
        require(bytes(fromCurrency).length > 0 && bytes(fromCurrency).length <= 10, "Bad fromCurrency");
        require(bytes(toCurrency).length > 0 && bytes(toCurrency).length <= 10, "Bad toCurrency");
        require(bytes(corridor).length > 0 && bytes(corridor).length <= 20, "Bad corridor");
        
        // Enforce currency and corridor consistency based on token addresses
        string memory symFrom = MentoTokens.getTokenSymbol(fromToken);
        string memory symTo = MentoTokens.getTokenSymbol(toToken);
        require(keccak256(bytes(fromCurrency)) == keccak256(bytes(symFrom)), "fromCurrency mismatch");
        require(keccak256(bytes(toCurrency)) == keccak256(bytes(symTo)), "toCurrency mismatch");
        string memory expectedCorridor = string(abi.encodePacked(symFrom, "-", symTo));
        require(keccak256(bytes(corridor)) == keccak256(bytes(expectedCorridor)), "corridor mismatch");
        
        // Pull tokens from sender (support fee-on-transfer by measuring actual received)
        uint256 beforeIn = IERC20(fromToken).balanceOf(address(this));
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 actualIn = IERC20(fromToken).balanceOf(address(this)) - beforeIn;
        require(actualIn > 0, "No input received");
        
        // Approve broker for exact amount
        IERC20(fromToken).forceApprove(mentoBroker, 0);
        IERC20(fromToken).forceApprove(mentoBroker, actualIn);
        
        // Track output balance before
        uint256 beforeOut = IERC20(toToken).balanceOf(address(this));
        
        // Execute swap via broker
        IMentoBroker(mentoBroker).swapIn(
            providerAddr,
            bytes32(exchangeId),
            fromToken,
            toToken,
            actualIn,
            minAmountOut
        );
        
        // Reset allowance to zero
        IERC20(fromToken).forceApprove(mentoBroker, 0);
        
        // Calculate amount out
        uint256 afterOut = IERC20(toToken).balanceOf(address(this));
        require(afterOut > beforeOut, "No output received");
        amountOut = afterOut - beforeOut;
        require(amountOut >= minAmountOut, "Insufficient output");
        
        // Fees in output token
        uint256 feeAmount = (amountOut * uint256(feeBps)) / 10000;
        uint256 netAmount = amountOut - feeAmount;
        
        // Transfer net amount to recipient
        IERC20(toToken).safeTransfer(recipient, netAmount);
        
        // Compute exchange rate scaled by 1e18
        uint256 exchangeRate = (amountOut * 1e18) / actualIn;
        
        // Store and emit
        remittanceId = _storeRemittance(
            msg.sender,
            recipient,
            fromToken,
            toToken,
            fromCurrency,
            toCurrency,
            actualIn,
            amountOut,
            exchangeRate,
            feeAmount,
            corridor
        );
        
        emit SwapExecuted(
            remittanceId,
            providerAddr,
            exchangeId,
            fromToken,
            toToken,
            amountIn,
            amountOut
        );
        
        emit TokensTransferred(remittanceId, toToken, recipient, netAmount);
        
        return (remittanceId, amountOut);
    }

    /**
     * @dev Perform two-hop swap via Mento Broker (from -> intermediate -> to) and send to recipient, then log remittance
     */
    function swapAndSendPath(
        address recipient,
        address fromToken,
        address intermediateToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        string memory fromCurrency,
        string memory toCurrency,
        string memory corridor,
        address providerAddr1,
        bytes32 exchangeId1,
        address providerAddr2,
        bytes32 exchangeId2,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 remittanceId, uint256 amountOut) {
        require(block.timestamp <= deadline, "Expired");
        require(mentoBroker != address(0), "Broker not set");
        require(recipient != address(0), "Invalid recipient address");
        require(providerAddr1 != address(0) && providerAddr2 != address(0), "Invalid provider");
        require(allowedProviders[providerAddr1] && allowedProviders[providerAddr2], "Provider not allowed");
        require(fromToken != address(0) && toToken != address(0) && intermediateToken != address(0), "Invalid token");
        require(fromToken != toToken && fromToken != intermediateToken && intermediateToken != toToken, "Token mismatch");
        require(MentoTokens.isSupportedToken(fromToken), "From token unsupported");
        require(MentoTokens.isSupportedToken(intermediateToken), "Inter token unsupported");
        require(MentoTokens.isSupportedToken(toToken), "To token unsupported");
        require(amountIn > 0, "amountIn = 0");
        require(minAmountOut > 0, "minOut = 0");
        require(bytes(fromCurrency).length > 0 && bytes(fromCurrency).length <= 10, "Bad fromCurrency");
        require(bytes(toCurrency).length > 0 && bytes(toCurrency).length <= 10, "Bad toCurrency");
        require(bytes(corridor).length > 0 && bytes(corridor).length <= 20, "Bad corridor");
        
        // Enforce currency and corridor consistency based on token addresses
        string memory symFrom = MentoTokens.getTokenSymbol(fromToken);
        string memory symTo = MentoTokens.getTokenSymbol(toToken);
        require(keccak256(bytes(fromCurrency)) == keccak256(bytes(symFrom)), "fromCurrency mismatch");
        require(keccak256(bytes(toCurrency)) == keccak256(bytes(symTo)), "toCurrency mismatch");
        string memory expectedCorridor = string(abi.encodePacked(symFrom, "-", symTo));
        require(keccak256(bytes(corridor)) == keccak256(bytes(expectedCorridor)), "corridor mismatch");

        // Pull tokens from sender
        uint256 beforeIn = IERC20(fromToken).balanceOf(address(this));
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 actualIn = IERC20(fromToken).balanceOf(address(this)) - beforeIn;
        require(actualIn > 0, "No input received");

        // Approve broker for hop1
        IERC20(fromToken).forceApprove(mentoBroker, 0);
        IERC20(fromToken).forceApprove(mentoBroker, actualIn);

        // Hop 1
        uint256 interBefore = IERC20(intermediateToken).balanceOf(address(this));
        IMentoBroker(mentoBroker).swapIn(
            providerAddr1,
            bytes32(exchangeId1),
            fromToken,
            intermediateToken,
            actualIn,
            1
        );
        // Reset allowance for hop1 token
        IERC20(fromToken).forceApprove(mentoBroker, 0);

        uint256 interAfter = IERC20(intermediateToken).balanceOf(address(this));
        require(interAfter > interBefore, "No inter output");
        uint256 interAmount = interAfter - interBefore;

        // Approve broker for hop2
        IERC20(intermediateToken).forceApprove(mentoBroker, 0);
        IERC20(intermediateToken).forceApprove(mentoBroker, interAmount);

        // Hop 2
        uint256 toBefore = IERC20(toToken).balanceOf(address(this));
        IMentoBroker(mentoBroker).swapIn(
            providerAddr2,
            bytes32(exchangeId2),
            intermediateToken,
            toToken,
            interAmount,
            minAmountOut
        );
        // Reset allowance for hop2 token
        IERC20(intermediateToken).forceApprove(mentoBroker, 0);

        uint256 toAfter = IERC20(toToken).balanceOf(address(this));
        require(toAfter > toBefore, "No final output");
        amountOut = toAfter - toBefore;
        require(amountOut >= minAmountOut, "Insufficient output");

        // Fees in output token
        uint256 feeAmount = (amountOut * uint256(feeBps)) / 10000;
        uint256 netAmount = amountOut - feeAmount;

        // Transfer net amount to recipient
        IERC20(toToken).safeTransfer(recipient, netAmount);

        // Compute exchange rate scaled by 1e18
        uint256 exchangeRate = (amountOut * 1e18) / actualIn;

        // Store and emit
        remittanceId = _storeRemittance(
            msg.sender,
            recipient,
            fromToken,
            toToken,
            fromCurrency,
            toCurrency,
            actualIn,
            amountOut,
            exchangeRate,
            feeAmount,
            corridor
        );

        emit SwapExecuted(remittanceId, providerAddr1, exchangeId1, fromToken, intermediateToken, actualIn, interAmount);
        emit SwapExecuted(remittanceId, providerAddr2, exchangeId2, intermediateToken, toToken, interAmount, amountOut);
        emit TokensTransferred(remittanceId, toToken, recipient, netAmount);

        return (remittanceId, amountOut);
    }
    
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
    
    function setBroker(address _broker) external onlyOwner {
        require(_broker != address(0), "Invalid broker");
        mentoBroker = _broker;
        emit BrokerUpdated(_broker);
    }
    
    function setFeeBps(uint16 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // max 10%
        feeBps = _feeBps;
        emit FeeBpsUpdated(_feeBps);
    }

    function setProviderAllowed(address provider, bool allowed) external onlyOwner {
        require(provider != address(0), "Invalid provider");
        allowedProviders[provider] = allowed;
        emit ProviderAllowed(provider, allowed);
    }

    function withdrawTokenFees(address token, address to) external onlyOwner {
        require(to != address(0), "Invalid to");
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(to, bal);
    }

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

    // ===== INTERNALS =====
    
    function _storeRemittance(
        address sender,
        address recipient,
        address fromToken,
        address toToken,
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amountSent,
        uint256 amountReceived,
        uint256 exchangeRate,
        uint256 platformFee,
        string memory corridor
    ) internal returns (uint256) {
        uint256 remittanceId = nextRemittanceId++;
        
        remittances[remittanceId] = Remittance({
            id: remittanceId,
            sender: sender,
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
            mentoTxHash: bytes32(0),
            corridor: corridor
        });
        
        userRemittances[sender].push(remittanceId);
        corridorVolume[corridor] += amountSent;
        totalVolume += amountSent;
        totalFees += platformFee;
        totalTransactions++;
        
        emit RemittanceLogged(
            remittanceId,
            sender,
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
} 
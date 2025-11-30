// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/IPermit2.sol';
import './interfaces/ISwapAdapter.sol';

contract FXRemitV2 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    address public constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    uint256 public constant ADAPTER_DELAY = 2 days;
    uint256 public constant MAX_TOKENS = 100;
    uint256 public constant MAX_ADAPTERS = 20;
    
    struct Remittance {
        uint256 id;
        address sender;
        address recipient;
        address fromToken;
        address toToken;
        string fromCurrency;
        string toCurrency;
        uint256 amountSent;
        uint256 amountReceived;
        uint256 exchangeRate;
        uint256 platformFee;
        uint256 timestamp;
        bytes32 mentoTxHash;
        string corridor;
    }
    mapping(uint256 => Remittance) public remittances;
    mapping(address => uint256[]) public userRemittances;
    mapping(string => uint256) public corridorVolume;
    mapping(bytes32 => bool) public processedTxs;
    mapping(address => bool) public supportedTokens;
    mapping(address => string) public tokenSymbols;
    address[] public tokenList;
    mapping(address => bool) public allowedAdapters;
    mapping(address => uint256) public adapterActivationTime;
    address[] public adapterList;
    address public defaultAdapter;
    mapping(address => bool) public allowedProviders;
    mapping(bytes32 => bool) public allowedExchanges;
    mapping(address => uint256) public collectedFees;
  mapping(address => uint256) public tokenVolume;
  uint16 public feeBps = 150;
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
    
  event FeesWithdrawn(
    address indexed token,
    address indexed to,
    uint256 amount
  );
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    
    event SwapExecuted(
        uint256 indexed remittanceId,
        address adapter,
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
    
    event FeeBpsUpdated(uint16 feeBps);
    event TokenAdded(address indexed token, string symbol);
    event TokenRemoved(address indexed token);
    event AdapterProposed(address indexed adapter, uint256 activationTime);
    event AdapterActivated(address indexed adapter, string name);
    event AdapterRemoved(address indexed adapter);
    event DefaultAdapterSet(address indexed adapter);
    event ProviderAllowed(address indexed provider, bool allowed);
    event ExchangeAllowed(bytes32 indexed exchangeId, bool allowed);
    
    constructor() Ownable(msg.sender) {
       
    }
    
    function setInitialAdapter(address adapter) external onlyOwner {
        require(defaultAdapter == address(0), 'Adapter already set');
        require(adapter != address(0), 'Need adapter');
        require(adapter.code.length > 0, 'Adapter must be contract');
        
        try ISwapAdapter(adapter).adapterName() returns (
            string memory name
        ) {
            allowedAdapters[adapter] = true;
            adapterList.push(adapter);
            defaultAdapter = adapter;
            
            emit AdapterActivated(adapter, name);
            emit DefaultAdapterSet(adapter);
        } catch {
            revert('Invalid adapter interface');
        }
    }
    
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
        uint256 nonce,
        uint256 deadline,
        bytes calldata permitSignature
  )
    external
    nonReentrant
    whenNotPaused
    returns (uint256 remittanceId, uint256 amountOut)
  {
    require(block.timestamp <= deadline, 'Expired');
    require(defaultAdapter != address(0), 'No adapter');
    require(recipient != address(0), 'Invalid recipient');
    require(fromToken != address(0) && toToken != address(0), 'Invalid token');
    require(fromToken != toToken, 'Tokens must differ');
    require(supportedTokens[fromToken], 'From token unsupported');
    require(supportedTokens[toToken], 'To token unsupported');
    require(allowedProviders[providerAddr], 'Provider not allowed');
    require(allowedExchanges[exchangeId], 'Exchange not allowed');

    require(amountIn > 0, 'amountIn = 0');
    require(minAmountOut > 0, 'minOut = 0');
    require(
      bytes(fromCurrency).length > 0 && bytes(fromCurrency).length <= 10,
      'Bad fromCurrency'
    );
    require(
      bytes(toCurrency).length > 0 && bytes(toCurrency).length <= 10,
      'Bad toCurrency'
    );
    require(
      bytes(corridor).length > 0 && bytes(corridor).length <= 20,
      'Bad corridor'
    );
        
        // Enforce currency consistency
        string memory symFrom = tokenSymbols[fromToken];
        string memory symTo = tokenSymbols[toToken];
    require(
      keccak256(bytes(fromCurrency)) == keccak256(bytes(symFrom)),
      'fromCurrency mismatch'
    );
    require(
      keccak256(bytes(toCurrency)) == keccak256(bytes(symTo)),
      'toCurrency mismatch'
    );
    string memory expectedCorridor = string(
      abi.encodePacked(symFrom, '-', symTo)
    );
    require(
      keccak256(bytes(corridor)) == keccak256(bytes(expectedCorridor)),
      'corridor mismatch'
    );

        uint256 actualIn = _transferViaPermit2(
            fromToken,
            amountIn,
            nonce,
            deadline,
            permitSignature
        );
        
        IERC20(fromToken).forceApprove(defaultAdapter, actualIn);
        uint256 adapterBalBefore = IERC20(fromToken).balanceOf(defaultAdapter);
        
        amountOut = ISwapAdapter(defaultAdapter).swapSingle(
            fromToken,
            toToken,
            actualIn,
            minAmountOut,
            providerAddr,
            exchangeId
        );
        
        uint256 adapterBalAfter = IERC20(fromToken).balanceOf(defaultAdapter);
    require(adapterBalAfter == adapterBalBefore, 'Adapter kept tokens');
        IERC20(fromToken).forceApprove(defaultAdapter, 0);
    require(amountOut >= minAmountOut, 'Insufficient output');
        
        uint256 feeAmount = (amountOut * uint256(feeBps)) / 10000;
        if (feeAmount == 0 && amountOut > 0) {
      feeAmount = 1;
        }
        uint256 netAmount = amountOut - feeAmount;
        collectedFees[toToken] += feeAmount;
        IERC20(toToken).safeTransfer(recipient, netAmount);
        
        uint256 exchangeRate;
        unchecked {
            exchangeRate = actualIn > 0 ? (amountOut * 1e18) / actualIn : 0;
        }
        
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
      defaultAdapter,
      fromToken,
      toToken,
      actualIn,
      amountOut
    );
        emit TokensTransferred(remittanceId, toToken, recipient, netAmount);
        
        return (remittanceId, amountOut);
    }

    function swapAndSendPath(
        address recipient,
        address fromToken,
        address intermediateToken,
        address toToken,
        uint256 amountIn,
        uint256 minIntermediateOut,
        uint256 minAmountOut,
        string memory fromCurrency,
        string memory toCurrency,
        string memory corridor,
        address providerAddr1,
        bytes32 exchangeId1,
        address providerAddr2,
        bytes32 exchangeId2,
        uint256 nonce,
        uint256 deadline,
        bytes calldata permitSignature
  )
    external
    nonReentrant
    whenNotPaused
    returns (uint256 remittanceId, uint256 amountOut)
  {
    require(block.timestamp <= deadline, 'Expired');
    require(defaultAdapter != address(0), 'No adapter');
    require(recipient != address(0), 'Invalid recipient');
    require(
      fromToken != address(0) &&
        toToken != address(0) &&
        intermediateToken != address(0),
      'Invalid token'
    );
    require(
      fromToken != toToken &&
        fromToken != intermediateToken &&
        intermediateToken != toToken,
      'Token mismatch'
    );
    require(supportedTokens[fromToken], 'From token unsupported');
    require(supportedTokens[intermediateToken], 'Inter token unsupported');
    require(supportedTokens[toToken], 'To token unsupported');
    require(allowedProviders[providerAddr1], 'Provider1 not allowed');
    require(allowedProviders[providerAddr2], 'Provider2 not allowed');
    require(allowedExchanges[exchangeId1], 'Exchange1 not allowed');
    require(allowedExchanges[exchangeId2], 'Exchange2 not allowed');

    require(amountIn > 0, 'amountIn = 0');
    require(minIntermediateOut > 0, 'minIntermediate = 0');
    require(minAmountOut > 0, 'minOut = 0');
    require(
      bytes(fromCurrency).length > 0 && bytes(fromCurrency).length <= 10,
      'Bad fromCurrency'
    );
    require(
      bytes(toCurrency).length > 0 && bytes(toCurrency).length <= 10,
      'Bad toCurrency'
    );
    require(
      bytes(corridor).length > 0 && bytes(corridor).length <= 20,
      'Bad corridor'
    );
        
        // Enforce currency consistency
        string memory symFrom = tokenSymbols[fromToken];
        string memory symTo = tokenSymbols[toToken];
    require(
      keccak256(bytes(fromCurrency)) == keccak256(bytes(symFrom)),
      'fromCurrency mismatch'
    );
    require(
      keccak256(bytes(toCurrency)) == keccak256(bytes(symTo)),
      'toCurrency mismatch'
    );
    string memory expectedCorridor = string(
      abi.encodePacked(symFrom, '-', symTo)
    );
    require(
      keccak256(bytes(corridor)) == keccak256(bytes(expectedCorridor)),
      'corridor mismatch'
    );

        uint256 actualIn = _transferViaPermit2(
            fromToken,
            amountIn,
            nonce,
            deadline,
            permitSignature
        );

        IERC20(fromToken).forceApprove(defaultAdapter, actualIn);
        uint256 adapterBalBefore = IERC20(fromToken).balanceOf(defaultAdapter);

        amountOut = ISwapAdapter(defaultAdapter).swapMultiHop(
            fromToken,
            intermediateToken,
            toToken,
            actualIn,
            minIntermediateOut,
            minAmountOut,
            providerAddr1,
            exchangeId1,
            providerAddr2,
            exchangeId2
        );

        uint256 adapterBalAfter = IERC20(fromToken).balanceOf(defaultAdapter);
    require(adapterBalAfter == adapterBalBefore, 'Adapter kept tokens');
        IERC20(fromToken).forceApprove(defaultAdapter, 0);
    require(amountOut >= minAmountOut, 'Insufficient output');

        uint256 feeAmount = (amountOut * uint256(feeBps)) / 10000;
        if (feeAmount == 0 && amountOut > 0) {
      feeAmount = 1;
        }
        uint256 netAmount = amountOut - feeAmount;
        collectedFees[toToken] += feeAmount;
        IERC20(toToken).safeTransfer(recipient, netAmount);

        uint256 exchangeRate;
        unchecked {
            exchangeRate = actualIn > 0 ? (amountOut * 1e18) / actualIn : 0;
        }

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
      defaultAdapter,
      fromToken,
      toToken,
      actualIn,
      amountOut
    );
        emit TokensTransferred(remittanceId, toToken, recipient, netAmount);

        return (remittanceId, amountOut);
    }
    
    // ===== VIEW FUNCTIONS =====
    
  function getRemittance(
    uint256 remittanceId
  ) external view returns (Remittance memory) {
    require(remittanceId > 0 && remittanceId < nextRemittanceId, 'Invalid ID');
        return remittances[remittanceId];
    }
    
  function getUserRemittances(
    address user
  ) external view returns (uint256[] memory) {
        return userRemittances[user];
    }
    
  function getUserRemittanceCount(
    address user
  ) external view returns (uint256) {
        return userRemittances[user].length;
    }
    
  function getCorridorVolume(
    string memory corridor
  ) external view returns (uint256) {
        return corridorVolume[corridor];
    }
    
  function getPlatformStats()
    external
    view
    returns (
        uint256 _totalVolume,
        uint256 _totalFees,
        uint256 _totalTransactions,
        uint256 _totalRemittances
    )
  {
        return (totalVolume, totalFees, totalTransactions, nextRemittanceId - 1);
    }
    
  function getUserStats(
    address user,
    uint256 maxTransactions
  )
    external
    view
    returns (
        uint256 userTotalSent,
        uint256 userTransactionsProcessed,
        uint256 userTotalFees,
        uint256 totalUserTransactions
    )
  {
    require(maxTransactions > 0 && maxTransactions <= 100, 'Invalid limit');
        
        uint256[] memory userTxs = userRemittances[user];
        uint256 totalSent = 0;
        uint256 totalUserFees = 0;
        
    uint256 limit = userTxs.length < maxTransactions
      ? userTxs.length
      : maxTransactions;
        
        for (uint256 i = 0; i < limit; i++) {
            Remittance memory remittance = remittances[userTxs[i]];
            totalSent += remittance.amountSent;
            totalUserFees += remittance.platformFee;
        }
        
        return (totalSent, limit, totalUserFees, userTxs.length);
    }
    
  function getRecentRemittances(
    uint256 limit
  ) external view returns (uint256[] memory) {
    require(limit > 0 && limit <= 100, 'Invalid limit');
        
        uint256 totalRemittances = nextRemittanceId - 1;
        uint256 resultLength = limit > totalRemittances ? totalRemittances : limit;
        uint256[] memory result = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = totalRemittances - i;
        }
        
        return result;
    }
    
  function isTransactionProcessed(
    bytes32 mentoTxHash
  ) external view returns (bool) {
        return processedTxs[mentoTxHash];
    }
    
    function isSupportedToken(address token) external view returns (bool) {
        return supportedTokens[token];
    }
    
    function getTokenSymbol(address token) external view returns (string memory) {
        return tokenSymbols[token];
    }
    
    function getSupportedTokensCount() external view returns (uint256) {
        return tokenList.length;
    }
    
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    function isAllowedAdapter(address adapter) external view returns (bool) {
        return allowedAdapters[adapter];
    }
    
    function getAdaptersCount() external view returns (uint256) {
        return adapterList.length;
    }
    
    function getAllAdapters() external view returns (address[] memory) {
        return adapterList;
    }
    
    function getDefaultAdapter() external view returns (address) {
        return defaultAdapter;
    }
    
    function getCollectedFees(address token) external view returns (uint256) {
        return collectedFees[token];
    }
    
  function getTokenVolume(address token) external view returns (uint256) {
    return tokenVolume[token];
  }
    
    function setFeeBps(uint16 _feeBps) external onlyOwner {
    require(_feeBps <= 1000, 'Fee too high');
        feeBps = _feeBps;
        emit FeeBpsUpdated(_feeBps);
    }

    function withdrawTokenFees(address token, address to) external onlyOwner {
    require(to != address(0), 'Invalid to');
        uint256 fees = collectedFees[token];
    require(fees > 0, 'No fees');
        
        collectedFees[token] = 0;
        IERC20(token).safeTransfer(to, fees);
        emit FeesWithdrawn(token, to, fees);
    }

    function withdrawFees(address payable to) external onlyOwner {
    require(to != address(0), 'Invalid address');
    require(address(this).balance > 0, 'No fees');
        uint256 balance = address(this).balance;
        to.transfer(balance);
        emit FeesWithdrawn(address(0), to, balance);
    }
    
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
    
  function addSupportedToken(
    address token,
    string memory symbol
  ) external onlyOwner {
    require(token != address(0), 'Invalid token');
    require(token.code.length > 0, 'Token must be contract');
    require(
      bytes(symbol).length > 0 && bytes(symbol).length <= 10,
      'Invalid symbol'
    );
    require(!supportedTokens[token], 'Already supported');
    require(tokenList.length < MAX_TOKENS, 'Max tokens reached');
        
        supportedTokens[token] = true;
        tokenSymbols[token] = symbol;
        tokenList.push(token);
        
        emit TokenAdded(token, symbol);
    }
    
    function removeSupportedToken(address token) external onlyOwner {
    require(supportedTokens[token], 'Not supported');
        
        supportedTokens[token] = false;
        delete tokenSymbols[token];
        
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(token);
    }
    
  function batchAddTokens(
    address[] memory tokens,
    string[] memory symbols
  ) external onlyOwner {
    require(tokens.length == symbols.length, 'Length mismatch');
    require(tokens.length > 0, 'Empty arrays');
    require(
      tokenList.length + tokens.length <= MAX_TOKENS,
      'Max tokens reached'
    );
        
        for (uint256 i = 0; i < tokens.length; i++) {
      require(tokens[i] != address(0), 'Invalid token');
      require(tokens[i].code.length > 0, 'Token must be contract');
      require(
        bytes(symbols[i]).length > 0 && bytes(symbols[i]).length <= 10,
        'Invalid symbol'
      );
      require(!supportedTokens[tokens[i]], 'Already supported');
            
            supportedTokens[tokens[i]] = true;
            tokenSymbols[tokens[i]] = symbols[i];
            tokenList.push(tokens[i]);
            
            emit TokenAdded(tokens[i], symbols[i]);
        }
    }
    
    function proposeSwapAdapter(address adapter) external onlyOwner {
    require(adapter != address(0), 'Invalid adapter');
    require(adapter.code.length > 0, 'Adapter must be contract');
    require(!allowedAdapters[adapter], 'Already added');
    require(adapterList.length < MAX_ADAPTERS, 'Max adapters reached');
        
        uint256 activationTime = block.timestamp + ADAPTER_DELAY;
        adapterActivationTime[adapter] = activationTime;
        
        emit AdapterProposed(adapter, activationTime);
    }
    
    function activateSwapAdapter(address adapter) external onlyOwner {
    require(adapterActivationTime[adapter] > 0, 'Not proposed');
    require(
      block.timestamp >= adapterActivationTime[adapter],
      'Timelock active'
    );
    require(!allowedAdapters[adapter], 'Already activated');
        
        try ISwapAdapter(adapter).adapterName() returns (string memory name) {
            allowedAdapters[adapter] = true;
            adapterList.push(adapter);
            
            emit AdapterActivated(adapter, name);
        } catch {
      revert('Invalid adapter interface');
        }
    }
    
    function removeSwapAdapter(address adapter) external onlyOwner {
    require(allowedAdapters[adapter], 'Not added');
    require(adapter != defaultAdapter, 'Cannot remove default');
        
        allowedAdapters[adapter] = false;
        delete adapterActivationTime[adapter];
        
        for (uint256 i = 0; i < adapterList.length; i++) {
            if (adapterList[i] == adapter) {
                adapterList[i] = adapterList[adapterList.length - 1];
                adapterList.pop();
                break;
            }
        }
        
        emit AdapterRemoved(adapter);
    }
    
    function setDefaultAdapter(address adapter) external onlyOwner {
    require(allowedAdapters[adapter], 'Adapter not allowed');
    require(adapter != address(0), 'Cannot set to zero');
        defaultAdapter = adapter;
        emit DefaultAdapterSet(adapter);
    }
    
  function setProviderAllowed(
    address provider,
    bool allowed
  ) external onlyOwner {
    require(provider != address(0), 'Invalid provider');
        allowedProviders[provider] = allowed;
        emit ProviderAllowed(provider, allowed);
    }
    
  function setExchangeAllowed(
    bytes32 exchangeId,
    bool allowed
  ) external onlyOwner {
    require(exchangeId != bytes32(0), 'Invalid exchange');
        allowedExchanges[exchangeId] = allowed;
        emit ExchangeAllowed(exchangeId, allowed);
    }
    
  function batchSetProvidersAllowed(
    address[] memory providers,
    bool allowed
  ) external onlyOwner {
    require(providers.length <= 100, 'Too many providers');
        for (uint256 i = 0; i < providers.length; i++) {
      require(providers[i] != address(0), 'Invalid provider');
            allowedProviders[providers[i]] = allowed;
            emit ProviderAllowed(providers[i], allowed);
        }
    }
    
  function batchSetExchangesAllowed(
    bytes32[] memory exchangeIds,
    bool allowed
  ) external onlyOwner {
    require(exchangeIds.length <= 100, 'Too many exchanges');
        for (uint256 i = 0; i < exchangeIds.length; i++) {
      require(exchangeIds[i] != bytes32(0), 'Invalid exchange');
            allowedExchanges[exchangeIds[i]] = allowed;
            emit ExchangeAllowed(exchangeIds[i], allowed);
        }
    }
    
    receive() external payable {}
    fallback() external payable {}
    
    function _transferViaPermit2(
        address token,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) internal returns (uint256) {
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        
        IPermit2(PERMIT2).permitTransferFrom(
            IPermit2.PermitTransferFrom({
        permitted: IPermit2.TokenPermissions({ token: token, amount: amount }),
                nonce: nonce,
                deadline: deadline
            }),
            IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amount
            }),
            msg.sender,
            signature
        );
        
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        uint256 actualAmount = balanceAfter - balanceBefore;
    require(actualAmount > 0, 'No tokens received');
        
        return actualAmount;
    }
    
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
    tokenVolume[fromToken] += amountSent;
    tokenVolume[toToken] += amountReceived;
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

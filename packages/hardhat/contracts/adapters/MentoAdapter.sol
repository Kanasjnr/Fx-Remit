// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ISwapAdapter.sol";
import "../interfaces/IMentoBroker.sol";

/**
 * @title MentoAdapter
 * @dev Swap adapter for Mento Protocol on Celo
 * @notice Implements ISwapAdapter for Mento-specific swap logic with security enhancements
 */
contract MentoAdapter is ISwapAdapter {
    using SafeERC20 for IERC20;
    
    address public immutable mentoBroker;
    address public immutable fxRemitContract;
    
    event SwapExecuted(
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut
    );
    
    modifier onlyFXRemit() {
        require(msg.sender == fxRemitContract, "Only FXRemit");
        _;
    }
    
    constructor(address _mentoBroker, address _fxRemitContract) {
        require(_mentoBroker != address(0), "Invalid broker");
        require(_fxRemitContract != address(0), "Invalid FXRemit");
        require(_mentoBroker.code.length > 0, "Broker must be contract");
        
        mentoBroker = _mentoBroker;
        fxRemitContract = _fxRemitContract;
    }
    
    /**
     * @dev Single-hop swap via Mento
     */
    function swapSingle(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address providerAddr,
        bytes32 exchangeId
    ) external override onlyFXRemit returns (uint256 amountOut) {
        require(fromToken != address(0) && toToken != address(0), "Invalid tokens");
        require(amountIn > 0, "Invalid amount");
        require(providerAddr != address(0), "Invalid provider");
        
        // Transfer tokens from FXRemit to this adapter
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve Mento broker
        IERC20(fromToken).forceApprove(mentoBroker, amountIn);
        
        // Track balance before swap
        uint256 balanceBefore = IERC20(toToken).balanceOf(address(this));
        
        // Execute swap via Mento
        IMentoBroker(mentoBroker).swapIn(
            providerAddr,
            exchangeId,
            fromToken,
            toToken,
            amountIn,
            minAmountOut
        );
        
        // Reset approval
        IERC20(fromToken).forceApprove(mentoBroker, 0);
        
        // Calculate output
        uint256 balanceAfter = IERC20(toToken).balanceOf(address(this));
        amountOut = balanceAfter - balanceBefore;
        require(amountOut >= minAmountOut, "Insufficient output");
        
        // Transfer output back to FXRemit
        IERC20(toToken).safeTransfer(msg.sender, amountOut);
        
        emit SwapExecuted(fromToken, toToken, amountIn, amountOut);
        return amountOut;
    }
    
    /**
     * @dev Multi-hop swap via Mento (two hops) with slippage protection
     */
    function swapMultiHop(
        address fromToken,
        address intermediateToken,
        address toToken,
        uint256 amountIn,
        uint256 minIntermediateOut,
        uint256 minAmountOut,
        address providerAddr1,
        bytes32 exchangeId1,
        address providerAddr2,
        bytes32 exchangeId2
    ) external override onlyFXRemit returns (uint256 amountOut) {
        require(
            fromToken != address(0) && 
            intermediateToken != address(0) && 
            toToken != address(0), 
            "Invalid tokens"
        );
        require(amountIn > 0, "Invalid amount");
        require(minIntermediateOut > 0, "Invalid minIntermediate");
        require(providerAddr1 != address(0) && providerAddr2 != address(0), "Invalid providers");
        
        // Transfer tokens from FXRemit to this adapter
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // First hop: fromToken -> intermediateToken (WITH SLIPPAGE PROTECTION)
        IERC20(fromToken).forceApprove(mentoBroker, amountIn);
        
        uint256 interBalanceBefore = IERC20(intermediateToken).balanceOf(address(this));
        
        IMentoBroker(mentoBroker).swapIn(
            providerAddr1,
            exchangeId1,
            fromToken,
            intermediateToken,
            amountIn,
            minIntermediateOut  // Real slippage protection on first hop!
        );
        
        IERC20(fromToken).forceApprove(mentoBroker, 0);
        
        uint256 interBalanceAfter = IERC20(intermediateToken).balanceOf(address(this));
        uint256 intermediateAmount = interBalanceAfter - interBalanceBefore;
        require(intermediateAmount >= minIntermediateOut, "Insufficient intermediate output");
        
        // Second hop: intermediateToken -> toToken
        IERC20(intermediateToken).forceApprove(mentoBroker, intermediateAmount);
        
        uint256 finalBalanceBefore = IERC20(toToken).balanceOf(address(this));
        
        IMentoBroker(mentoBroker).swapIn(
            providerAddr2,
            exchangeId2,
            intermediateToken,
            toToken,
            intermediateAmount,
            minAmountOut
        );
        
        IERC20(intermediateToken).forceApprove(mentoBroker, 0);
        
        uint256 finalBalanceAfter = IERC20(toToken).balanceOf(address(this));
        amountOut = finalBalanceAfter - finalBalanceBefore;
        require(amountOut >= minAmountOut, "Insufficient output");
        
        // Transfer output back to FXRemit
        IERC20(toToken).safeTransfer(msg.sender, amountOut);
        
        emit SwapExecuted(fromToken, toToken, amountIn, amountOut);
        return amountOut;
    }
    
    /**
     * @dev Get adapter name
     */
    function adapterName() external pure override returns (string memory) {
        return "Mento Protocol Adapter";
    }
    
    /**
     * @dev Get supported protocol
     */
    function protocol() external pure override returns (string memory) {
        return "Mento";
    }
}

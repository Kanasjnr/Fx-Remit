// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISwapAdapter
 * @dev Interface for swap adapters that connect FXRemit to different DEXes
 * @notice Each adapter implements DEX-specific swap logic
 */
interface ISwapAdapter {
    /**
     * @dev Single-hop swap
     * @param fromToken Source token address
     * @param toToken Destination token address
     * @param amountIn Amount of source tokens to swap
     * @param minAmountOut Minimum acceptable output amount
     * @param providerAddr DEX provider address (exchange-specific)
     * @param exchangeId Exchange ID (exchange-specific)
     * @return amountOut Actual amount of tokens received
     */
    function swapSingle(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address providerAddr,
        bytes32 exchangeId
    ) external returns (uint256 amountOut);
    
    /**
     * @dev Multi-hop swap (two hops) with slippage protection on intermediate hop
     * @param fromToken Source token address
     * @param intermediateToken Intermediate token address
     * @param toToken Destination token address
     * @param amountIn Amount of source tokens to swap
     * @param minIntermediateOut Minimum acceptable intermediate output amount
     * @param minAmountOut Minimum acceptable final output amount
     * @param providerAddr1 First hop provider address
     * @param exchangeId1 First hop exchange ID
     * @param providerAddr2 Second hop provider address
     * @param exchangeId2 Second hop exchange ID
     * @return amountOut Actual amount of tokens received
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
    ) external returns (uint256 amountOut);
    
    /**
     * @dev Get adapter name
     * @return name Human-readable adapter name
     */
    function adapterName() external pure returns (string memory);
    
    /**
     * @dev Get supported DEX protocol
     * @return protocol Protocol name (e.g., "Mento", "UniswapV3")
     */
    function protocol() external pure returns (string memory);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMentoBroker {
    function swapIn(
        address providerAddr,
        uint256 exchangeId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external;
}



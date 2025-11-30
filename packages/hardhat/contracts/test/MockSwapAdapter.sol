// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ISwapAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockSwapAdapter is ISwapAdapter {
    using SafeERC20 for IERC20;
    
    address public immutable fxRemitContract;
    uint256 public constant EXCHANGE_RATE = 85e16; // 0.85 (for testing)
    
    modifier onlyFXRemit() {
        require(msg.sender == fxRemitContract, "Only FXRemit");
        _;
    }
    
    constructor(address _fxRemitContract) {
        fxRemitContract = _fxRemitContract;
    }
    
    function swapSingle(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address /* providerAddr */,
        bytes32 /* exchangeId */
    ) external override onlyFXRemit returns (uint256 amountOut) {
        require(fromToken != address(0) && toToken != address(0), "Invalid tokens");
        require(amountIn > 0, "Invalid amount");
        
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        
        amountOut = (amountIn * EXCHANGE_RATE) / 1e18;
        require(amountOut >= minAmountOut, "Insufficient output");
        
        IERC20(toToken).safeTransfer(msg.sender, amountOut);
        
        return amountOut;
    }
    
    function swapMultiHop(
        address fromToken,
        address intermediateToken,
        address toToken,
        uint256 amountIn,
        uint256 minIntermediateOut,
        uint256 minAmountOut,
        address /* providerAddr1 */,
        bytes32 /* exchangeId1 */,
        address /* providerAddr2 */,
        bytes32 /* exchangeId2 */
    ) external override onlyFXRemit returns (uint256 amountOut) {
        require(
            fromToken != address(0) && 
            intermediateToken != address(0) && 
            toToken != address(0),
            "Invalid tokens"
        );
        require(amountIn > 0, "Invalid amount");
        
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amountIn);
        
        uint256 intermediateOut = (amountIn * EXCHANGE_RATE) / 1e18;
        require(intermediateOut >= minIntermediateOut, "Insufficient intermediate");
        
        uint256 finalOut = (intermediateOut * EXCHANGE_RATE) / 1e18;
        require(finalOut >= minAmountOut, "Insufficient output");
        
        IERC20(toToken).safeTransfer(msg.sender, finalOut);
        
        return finalOut;
    }
    
    function adapterName() external pure override returns (string memory) {
        return "Mock Swap Adapter";
    }
    
    function protocol() external pure override returns (string memory) {
        return "Mock";
    }
}


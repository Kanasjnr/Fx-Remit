// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MentoTokens
 * @dev Constants for Mento Protocol token addresses on Celo mainnet
 */
library MentoTokens {
  // ===== CELO MAINNET ADDRESSES =====

  // Major Global Currencies
  address public constant cUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a; // US Dollar
  address public constant cEUR = 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73; // Euro
  address public constant cGBP = 0xCCF663b1fF11028f0b19058d0f7B674004a40746; // British Pound
  address public constant cCAD = 0xff4Ab19391af240c311c54200a492233052B6325; // Canadian Dollar
  address public constant cAUD = 0x7175504C455076F15c04A2F90a8e352281F492F9; // Australian Dollar
  address public constant cCHF = 0xb55a79F398E759E43C95b979163f30eC87Ee131D; // Swiss Franc
  address public constant cJPY = 0xc45eCF20f3CD864B32D9794d6f76814aE8892e20; // Japanese Yen

  // Emerging Markets
  address public constant cREAL = 0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787; // Brazilian Real
  address public constant cCOP = 0x8A567e2aE79CA692Bd748aB832081C45de4041eA; // Colombian Peso
  address public constant cKES = 0x456a3D042C0DbD3db53D5489e98dFb038553B0d0; // Kenyan Shilling
  address public constant cNGN = 0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71; // Nigerian Naira
  address public constant cZAR = 0x4c35853A3B4e647fD266f4de678dCc8fEC410BF6; // South African Rand
  address public constant cGHS = 0xfAeA5F3404bbA20D3cc2f8C4B0A888F55a3c7313; // Ghanaian Cedi
  address public constant eXOF = 0x73F93dcc49cB8A239e2032663e9475dd5ef29A08; // CFA Franc
  address public constant PUSO = 0x105d4A9306D2E55a71d2Eb95B81553AE1dC20d7B; // Philippine Peso

  // ===== UTILITY FUNCTIONS =====

  /**
   * @dev Check if a token address is supported
   */
  function isSupportedToken(address token) internal pure returns (bool) {
    return
      token == cUSD ||
      token == cEUR ||
      token == cREAL ||
      token == cKES ||
      token == PUSO ||
      token == cCOP ||
      token == eXOF ||
      token == cNGN ||
      token == cJPY ||
      token == cCHF ||
      token == cZAR ||
      token == cGBP ||
      token == cAUD ||
      token == cCAD ||
      token == cGHS;
  }

  /**
   * @dev Get token symbol from address
   */
  function getTokenSymbol(address token) internal pure returns (string memory) {
    if (token == cUSD) return 'cUSD';
    if (token == cEUR) return 'cEUR';
    if (token == cREAL) return 'cREAL';
    if (token == cKES) return 'cKES';
    if (token == PUSO) return 'PUSO';
    if (token == cCOP) return 'cCOP';
    if (token == eXOF) return 'eXOF';
    if (token == cNGN) return 'cNGN';
    if (token == cJPY) return 'cJPY';
    if (token == cCHF) return 'cCHF';
    if (token == cZAR) return 'cZAR';
    if (token == cGBP) return 'cGBP';
    if (token == cAUD) return 'cAUD';
    if (token == cCAD) return 'cCAD';
    if (token == cGHS) return 'cGHS';
    return 'UNKNOWN';
  }
}

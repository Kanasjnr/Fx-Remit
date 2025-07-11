// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MentoTokens
 * @dev Constants for Mento Protocol token addresses on Alfajores testnet
 */
library MentoTokens {
  // ===== ALFAJORES TESTNET ADDRESSES =====

  // Major Global Currencies
  address public constant cUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1; // US Dollar
  address public constant cEUR = 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F; // Euro
  address public constant cGBP = 0x47f2Fb88105155a18c390641C8a73f1402B2BB12; // British Pound
  address public constant cCAD = 0x02EC9E0D2Fd73e89168C1709e542a48f58d7B133; // Canadian Dollar
  address public constant cAUD = 0x84CBD49F5aE07632B6B88094E81Cce8236125Fe0; // Australian Dollar
  address public constant cCHF = 0xADC57C2C34aD021Df4421230a6532F4e2E1dCE4F; // Swiss Franc
  address public constant cJPY = 0x2E51F41238cA36a421C9B8b3e189e8Cc7653FE67; // Japanese Yen

  // Emerging Markets
  address public constant cREAL = 0xE4D517785D091D3c54818832dB6094bcc2744545; // Brazilian Real
  address public constant cCOP = 0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4; // Colombian Peso
  address public constant cKES = 0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92; // Kenyan Shilling
  address public constant cNGN = 0x4a5b03B8b16122D330306c65e4CA4BC5Dd6511d0; // Nigerian Naira
  address public constant cZAR = 0x1e5b44015Ff90610b54000DAad31C89b3284df4d; // South African Rand
  address public constant cGHS = 0x295B66bE7714458Af45E6A6Ea142A5358A6cA375; // Ghanaian Cedi
  address public constant eXOF = 0xB0FA15e002516d0301884059c0aaC0F0C72b019D; // CFA Franc
  address public constant PUSO = 0x5E0E3c9419C42a1B04e2525991FB1A2C467AB8bF; // Philippine Peso

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

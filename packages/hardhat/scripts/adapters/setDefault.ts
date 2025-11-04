const hre = require('hardhat');
const { ethers } = hre;

/**
 * Script to set default swap adapter for FXRemitV2
 * Usage: npx hardhat run scripts/adapters/setDefault.ts --network celo
 */

async function main() {
  // Configuration
  const FX_REMIT_V2_ADDRESS = process.env.FX_REMIT_V2_ADDRESS || "YOUR_CONTRACT_ADDRESS";
  const ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS || "YOUR_ADAPTER_ADDRESS";
  
  console.log("Setting default adapter for FXRemitV2...");
  console.log("FXRemitV2:", FX_REMIT_V2_ADDRESS);
  console.log("Adapter:", ADAPTER_ADDRESS);
  
  // Get contract
  const fxRemitV2 = await ethers.getContractAt("FXRemitV2", FX_REMIT_V2_ADDRESS);
  
  // Check if adapter is allowed
  const isAllowed = await fxRemitV2.isAllowedAdapter(ADAPTER_ADDRESS);
  if (!isAllowed) {
    console.error("Error: Adapter not in allowed list!");
    console.log("Add it first using: npx hardhat run scripts/adapters/addAdapter.ts");
    return;
  }
  
  // Get current default
  const currentDefault = await fxRemitV2.getDefaultAdapter();
  console.log("\nCurrent default adapter:", currentDefault);
  
  if (currentDefault.toLowerCase() === ADAPTER_ADDRESS.toLowerCase()) {
    console.log("This adapter is already the default!");
    return;
  }
  
  // Set new default
  console.log("Setting new default adapter...");
  const tx = await fxRemitV2.setDefaultAdapter(ADAPTER_ADDRESS);
  await tx.wait();
  
  console.log("Default adapter updated successfully!");
  
  // Verify
  const newDefault = await fxRemitV2.getDefaultAdapter();
  console.log("\nNew default adapter:", newDefault);
  console.log("\nAll new swaps will now use this adapter!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


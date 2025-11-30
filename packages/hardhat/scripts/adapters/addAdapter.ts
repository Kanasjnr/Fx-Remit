const hre = require('hardhat');
const { ethers } = hre;

/**
 * Script to add a new swap adapter to FXRemitV2
 * Usage: npx hardhat run scripts/adapters/addAdapter.ts --network celo
 */

async function main() {
  // Configuration
  const FX_REMIT_V2_ADDRESS = process.env.FX_REMIT_V2_ADDRESS || "YOUR_CONTRACT_ADDRESS";
  const NEW_ADAPTER_ADDRESS = process.env.NEW_ADAPTER_ADDRESS || "YOUR_ADAPTER_ADDRESS";
  
  console.log("Adding new adapter to FXRemitV2...");
  console.log("FXRemitV2:", FX_REMIT_V2_ADDRESS);
  console.log("New Adapter:", NEW_ADAPTER_ADDRESS);
  
  // Get contract
  const fxRemitV2 = await ethers.getContractAt("FXRemitV2", FX_REMIT_V2_ADDRESS);
  
  // Check if already added
  const isAllowed = await fxRemitV2.isAllowedAdapter(NEW_ADAPTER_ADDRESS);
  if (isAllowed) {
    console.log("Adapter already added!");
    return;
  }
  
  // Add adapter
  console.log("Adding adapter...");
  const tx = await fxRemitV2.addSwapAdapter(NEW_ADAPTER_ADDRESS);
  await tx.wait();
  
  console.log("Adapter added successfully!");
  
  // Verify
  const adaptersCount = await fxRemitV2.getAdaptersCount();
  const allAdapters = await fxRemitV2.getAllAdapters();
  
  console.log("\nCurrent adapters:", adaptersCount.toString());
  console.log("Adapter list:", allAdapters);
  
  console.log("\nNote: This adapter is now AVAILABLE but not ACTIVE.");
  console.log("To make it active, run: npx hardhat run scripts/adapters/setDefault.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


const hre = require('hardhat');
const { ethers } = hre;

/**
 * Script to list all adapters in FXRemitV2
 * Usage: npx hardhat run scripts/adapters/listAdapters.ts --network celo
 */

async function main() {
  // Configuration
  const FX_REMIT_V2_ADDRESS = process.env.FX_REMIT_V2_ADDRESS || "YOUR_CONTRACT_ADDRESS";
  
  console.log("Listing adapters for FXRemitV2...");
  console.log("FXRemitV2:", FX_REMIT_V2_ADDRESS);
  console.log("");
  
  // Get contract
  const fxRemitV2 = await ethers.getContractAt("FXRemitV2", FX_REMIT_V2_ADDRESS);
  
  // Get adapter info
  const adaptersCount = await fxRemitV2.getAdaptersCount();
  const allAdapters = await fxRemitV2.getAllAdapters();
  const defaultAdapter = await fxRemitV2.getDefaultAdapter();
  
  console.log(`Total adapters: ${adaptersCount}`);
  console.log(`Default adapter: ${defaultAdapter}`);
  console.log("");
  console.log("All adapters:");
  console.log("================================");
  
  for (let i = 0; i < allAdapters.length; i++) {
    const adapterAddr = allAdapters[i];
    const isDefault = adapterAddr.toLowerCase() === defaultAdapter.toLowerCase();
    
    try {
      const adapter = await ethers.getContractAt("ISwapAdapter", adapterAddr);
      const name = await adapter.adapterName();
      const protocol = await adapter.protocol();
      
      console.log(`${i + 1}. ${adapterAddr}`);
      console.log(`   Name: ${name}`);
      console.log(`   Protocol: ${protocol}`);
      console.log(`   Status: ${isDefault ? "ACTIVE (Default)" : "Available"}`);
      console.log("");
    } catch (error) {
      console.log(`${i + 1}. ${adapterAddr}`);
      console.log(`   Status: ${isDefault ? "ACTIVE (Default)" : "Available"}`);
      console.log(`   (Unable to fetch details)`);
      console.log("");
    }
  }
  
  console.log("================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


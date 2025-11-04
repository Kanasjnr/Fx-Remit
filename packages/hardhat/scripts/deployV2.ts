const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  console.log("Deploying SECURE FXRemitV2 with Permit2 + Adapters...");
  console.log("Security features: Timelock, Fee tracking, Provider whitelist\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Mento Broker address on Celo Mainnet
  const MENTO_BROKER = "0x777A8255cA72412f0d706dc03C9D1987306B4CaD";
  
  // Step 1: Deploy FXRemitV2 first (no adapter required)
  console.log("\n[1/5] Deploying FXRemitV2...");
  const FXRemitV2Factory = await ethers.getContractFactory("FXRemitV2");
  const fxRemitV2 = await FXRemitV2Factory.deploy();
  await fxRemitV2.waitForDeployment();
  const v2Address = await fxRemitV2.getAddress();
  console.log("FXRemitV2 deployed to:", v2Address);
  
  // Step 2: Deploy MentoAdapter (now we have FXRemitV2 address!)
  console.log("\n[2/5] Deploying MentoAdapter...");
  const MentoAdapterFactory = await ethers.getContractFactory("MentoAdapter");
  const mentoAdapter = await MentoAdapterFactory.deploy(MENTO_BROKER, v2Address);
  await mentoAdapter.waitForDeployment();
  const adapterAddress = await mentoAdapter.getAddress();
  console.log("MentoAdapter deployed to:", adapterAddress)
  
  // Step 3: Set MentoAdapter as initial adapter
  console.log("\n[3/5] Setting MentoAdapter as initial adapter...");
  const setInitialTx = await fxRemitV2.setInitialAdapter(adapterAddress);
  await setInitialTx.wait();
  console.log("MentoAdapter set as default adapter");
  
  // Step 4: Configure FXRemitV2 security
  console.log("\n[4/5] Configuring FXRemitV2 security...");
  // Whitelist Mento broker as provider
  console.log("\nWhitelisting Mento broker as provider...");
  const whitelistProviderTx = await fxRemitV2.setProviderAllowed(MENTO_BROKER, true);
  await whitelistProviderTx.wait();
  console.log("Mento broker whitelisted");
  
  // Step 5: Add supported tokens
  console.log("\n[5/5] Adding supported tokens...");
  
  // Token addresses and symbols on Celo Mainnet
  const tokens = [
    // Existing Mento tokens
    { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", symbol: "cUSD" },
    { address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", symbol: "cEUR" },
    { address: "0xCCF663b1fF11028f0b19058d0f7B674004a40746", symbol: "cGBP" },
    { address: "0xff4Ab19391af240c311c54200a492233052B6325", symbol: "cCAD" },
    { address: "0x7175504C455076F15c04A2F90a8e352281F492F9", symbol: "cAUD" },
    { address: "0xb55a79F398E759E43C95b979163f30eC87Ee131D", symbol: "cCHF" },
    { address: "0xc45eCF20f3CD864B32D9794d6f76814aE8892e20", symbol: "cJPY" },
    { address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", symbol: "cREAL" },
    { address: "0x8A567e2aE79CA692Bd748aB832081C45de4041eA", symbol: "cCOP" },
    { address: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0", symbol: "cKES" },
    { address: "0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71", symbol: "cNGN" },
    { address: "0x4c35853A3B4e647fD266f4de678dCc8fEC410BF6", symbol: "cZAR" },
    { address: "0xfAeA5F3404bbA20D3cc2f8C4B0A888F55a3c7313", symbol: "cGHS" },
    { address: "0x73F93dcc49cB8A239e2032663e9475dd5ef29A08", symbol: "eXOF" },
    { address: "0x105d4A9306D2E55a71d2Eb95B81553AE1dC20d7B", symbol: "PUSO" },
    
    // NEW: USDT and USDC on Celo
    { address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", symbol: "USD₮" },
    { address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", symbol: "USDC" },
  ];

  const addresses = tokens.map(t => t.address);
  const symbols = tokens.map(t => t.symbol);
  
  const batchAddTx = await fxRemitV2.batchAddTokens(addresses, symbols);
  await batchAddTx.wait();
  console.log(`Added ${tokens.length} tokens (including USDT & USDC):`);
  tokens.forEach(t => console.log(`   - ${t.symbol}: ${t.address}`));

  // Verify configuration
  console.log("\nVerifying deployment...");
  const supportedCount = await fxRemitV2.getSupportedTokensCount();
  const defaultAdapter = await fxRemitV2.getDefaultAdapter();
  const feeBps = await fxRemitV2.feeBps();
  const permit2 = await fxRemitV2.PERMIT2();
  const adapterDelay = await fxRemitV2.ADAPTER_DELAY();
  const maxTokens = await fxRemitV2.MAX_TOKENS();
  const maxAdapters = await fxRemitV2.MAX_ADAPTERS();
  
  console.log("\nContract Configuration:");
  console.log("- Supported tokens:", supportedCount.toString());
  console.log("- Default adapter:", defaultAdapter);
  console.log("- Fee (bps):", feeBps.toString(), `(${Number(feeBps) / 100}%)`);
  console.log("- Permit2 address:", permit2);
  console.log("- Adapter timelock:", adapterDelay.toString(), "seconds (2 days)");
  console.log("- Max tokens:", maxTokens.toString());
  console.log("- Max adapters:", maxAdapters.toString());

  console.log("\nSecurity Features:");
  console.log("- Permit2 for 1-click swaps");
  console.log("- 2-day adapter timelock");
  console.log("- Separate fee tracking (no user fund theft)");
  console.log("- Provider/exchange whitelist");
  console.log("- Minimum fee (1 wei)");
  console.log("- Adapter balance verification");
  console.log("- Bounded array iteration");

  console.log("\nDeployment Complete!");
  console.log("\nContract Addresses:");
  console.log("================================");
  console.log("FXRemitV2:", v2Address);
  console.log("MentoAdapter:", adapterAddress);
  console.log("Permit2:", permit2);
  console.log("================================");
  
  console.log("\nNEXT STEPS:");
  console.log("1. Whitelist exchange IDs using setExchangeAllowed()");
  console.log("2. Update frontend to pass nonce parameter");
  console.log("3. Update frontend to pass minIntermediateOut for multi-hop");
  console.log("4. Test on Alfajores first!");
  console.log("5. Wait 2 days before adding new adapters (timelock)");
  
  console.log("\nUpdate your frontend config with V2 address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

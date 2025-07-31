const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  // Get network information using the correct API
  const networkName = hre.network.name;
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  
  // Ensure we're deploying to Celo mainnet only
  if (networkName !== 'celo') {
    console.error(`❌ This script only supports Celo mainnet deployment. Current network: ${networkName}`);
    console.error('Please switch to Celo mainnet and try again.');
    process.exit(1);
  }
  
  console.log(`\nDeploying FXRemit to Celo mainnet (Chain ID: ${chainId})`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} CELO`);
  
  console.log('\nDeploying FXRemit contract with Mento token validation...');
  const FXRemit = await ethers.getContractFactory('FXRemit');
  
  const fxRemit = await FXRemit.deploy();
  await fxRemit.waitForDeployment();
  
  const contractAddress = await fxRemit.getAddress();
  console.log(`FXRemit deployed to: ${contractAddress}`);
  
  // Test token validation with mainnet addresses
  console.log('\nTesting token validation...');
  const cUSDAddress = '0x765DE816845861e75A25fCA122bb6898B8B1282a'; // Mainnet cUSD
  const cKESAddress = '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0'; // Mainnet cKES
  
  const isUSDSupported = await fxRemit.isSupportedToken(cUSDAddress);
  const isKESSupported = await fxRemit.isSupportedToken(cKESAddress);
  
  console.log(`cUSD (${cUSDAddress}) supported: ${isUSDSupported}`);
  console.log(`cKES (${cKESAddress}) supported: ${isKESSupported}`);
  
  // Verify contract on Celo mainnet
  console.log('\nVerifying contract on Celo explorer...');
  
  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log('Contract verified successfully');
  } catch (error) {
    console.log('Contract verification failed:', error);
    console.log(`You can manually verify later: npx hardhat verify --network celo ${contractAddress}`);
  }
  
  console.log('\nDeployment Summary:');
  console.log(`Network: Celo mainnet`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Transaction Hash: ${fxRemit.deploymentTransaction()?.hash}`);
  
  console.log(`\nView on Explorer: https://celoscan.io/address/${contractAddress}`);
  
  console.log('\nDeployment completed successfully on Celo mainnet!');
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  }); 
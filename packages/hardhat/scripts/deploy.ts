const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log(`\nDeploying FXRemit to ${networkName} (Chain ID: ${network.chainId})`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} Celo`);
  
  console.log('\nDeploying FXRemit contract with Mento token validation...');
  const FXRemit = await ethers.getContractFactory('FXRemit');
  
  const fxRemit = await FXRemit.deploy();
  await fxRemit.waitForDeployment();
  
  const contractAddress = await fxRemit.getAddress();
  console.log(`FXRemit deployed to: ${contractAddress}`);
  
  // Test token validation
  console.log('\nTesting token validation...');
  const cUSDAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
  const cKESAddress = '0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92';
  
  const isUSDSupported = await fxRemit.isSupportedToken(cUSDAddress);
  const isKESSupported = await fxRemit.isSupportedToken(cKESAddress);
  
  console.log(`cUSD (${cUSDAddress}) supported: ${isUSDSupported}`);
  console.log(`cKES (${cKESAddress}) supported: ${isKESSupported}`);
  
  // Verify contract on supported networks
  if (networkName === 'alfajores' || networkName === 'celo') {
    console.log('\nVerifying contract on explorer...');
    
    try {
      await hre.run('verify:verify', {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log('Contract verified successfully');
    } catch (error) {
      console.log('Contract verification failed:', error);
      console.log(`You can manually verify later: npx hardhat verify --network ${networkName} ${contractAddress}`);
    }
  }
  
  console.log('\nDeployment Summary:');
  console.log(`Network: ${networkName}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Transaction Hash: ${fxRemit.deploymentTransaction()?.hash}`);
  
  if (networkName === 'alfajores') {
    console.log(`\nView on Explorer: https://alfajores.celoscan.io/address/${contractAddress}`);
  } else if (networkName === 'celo') {
    console.log(`\nView on Explorer: https://celoscan.io/address/${contractAddress}`);
  }
  
  console.log('\nDeployment completed successfully!');
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  }); 
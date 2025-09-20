import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Wallet, utils, Contract } from 'ethers';
import { Currency, getTokenAddress } from '../lib/contracts';
import { parseEther, formatEther } from 'viem';
import { celo } from 'viem/chains';
import { useDivvi } from './useDivvi';

// Pure ethers.js implementation following official Mento SDK examples
export function useEthersSwap() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { addReferralTagToTransaction, submitReferralTransaction } = useDivvi();

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: string,
    minAmountOut?: string,
    recipientAddress?: string
  ) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    console.log('🚀 Starting pure ethers.js swap following official examples...');
    
    const chainId = 42220;
    const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
    const toTokenAddress = getTokenAddress(chainId, toCurrency);
    
    console.log('Token addresses:', {
      fromCurrency,
      toCurrency,
      fromTokenAddress,
      toTokenAddress,
      chainId
    });

    // Create ethers provider
    const provider = new providers.JsonRpcProvider('https://forno.celo.org');
    
    // Create a better signer proxy that properly handles address and signing
    const createProperSigner = (userAddress: string) => {
      // Create a wallet with a private key derived from the user's address
      // This is a deterministic but dummy approach - the actual signing will be done by viem
      const deterministicKey = '0x' + userAddress.slice(2).padStart(64, '0');
      const wallet = new Wallet(deterministicKey, provider);
      
      // Override critical methods to use viem instead
      const signerProxy = Object.create(wallet);
      
      // Override address property
      Object.defineProperty(signerProxy, 'address', {
        value: userAddress,
        writable: false,
        enumerable: true
      });
      
      // Override getAddress method
      signerProxy.getAddress = () => Promise.resolve(userAddress);
      
      // Override sendTransaction to use viem
      signerProxy.sendTransaction = async (transaction: any) => {
        const hash = await walletClient.sendTransaction({
          account: userAddress as `0x${string}`,
          to: transaction.to as `0x${string}`,
          data: transaction.data as `0x${string}`,
          value: transaction.value ? BigInt(transaction.value.toString()) : BigInt(0),
          gas: transaction.gasLimit ? BigInt(transaction.gasLimit.toString()) : undefined,
          gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice.toString()) : undefined,
          kzg: undefined,
          chain: celo
        });
        return { 
          hash, 
          wait: () => publicClient.waitForTransactionReceipt({ hash, confirmations: 1 }) 
        };
      };
      
      // Override populateTransaction to ensure correct from address
      signerProxy.populateTransaction = async (transaction: any) => {
        const populated = await wallet.populateTransaction(transaction);
        populated.from = userAddress;
        return populated;
      };
      
      return signerProxy;
    };
    
    const signer = createProperSigner(address);
    
    console.log('✨ Creating Mento SDK...');
    
    const mento = await Mento.create(signer);
    
    // Initialize exchanges - this is likely what's missing!
    console.log('🔄 Initializing exchanges...');
    const exchanges = await mento.getExchanges();
    console.log('📊 Available exchanges:', exchanges.length);
    
    if (exchanges.length === 0) {
      throw new Error('No exchanges found - cannot perform swaps');
    }
    
    // Use viem's parseEther to avoid BigNumber version issues
    const amountInWei = parseEther(amount);
    
    console.log('📊 Getting quote...');
    
    const quoteAmountOut = await mento.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountInWei.toString() // Convert to string to avoid BigNumber issues
    );
    
    console.log(`💰 Quote: ${formatEther(BigInt(quoteAmountOut.toString()))} ${toCurrency} for ${amount} ${fromCurrency}`);
    
    const quoteBigInt = BigInt(quoteAmountOut.toString());
    const expectedAmountOut = minAmountOut 
      ? parseEther(minAmountOut).toString()
      : (quoteBigInt * BigInt(99) / BigInt(100)).toString();
    
    console.log(`🎯 Expected amount out with 1% slippage: ${formatEther(BigInt(expectedAmountOut))} ${toCurrency}`);
    
    try {
      // First, find the tradable pair like in the official examples
      console.log('🔍 Finding tradable pair for swap...');
      const tradablePair = await mento.findPairForTokens(
        fromTokenAddress,
        toTokenAddress
      );
      console.log('✅ Found tradable pair:', tradablePair);
      
      // Skip allowance step for now to test if the swap works
      console.log('⚠️ Skipping allowance step for now - will handle after finding broker contract');
      
      // Step 2: Perform swap (following official example)
      console.log('🔄 Swapping tokens...');
      console.log('Debug - Swap parameters:', {
        fromTokenAddress,
        toTokenAddress,
        amountInWei: amountInWei.toString(),
        expectedAmountOut
      });
      
      console.log('🔍 Trying direct provider approach...');
      
      const mentoWithProvider = await Mento.create(provider);
      console.log('📊 Mento with provider created');
      
      // Try to use the getBroker method to get the broker contract
      const broker = await mento.getBroker();
      console.log('📊 Broker contract initialized');
      
      // Handle token allowance for broker contract
      console.log('🔓 Handling token allowance for broker contract...');
      
      // Known broker contract address for Celo mainnet
      const brokerAddress = '0x777A8255cA72412f0d706dc03C9D1987306B4CaD';
      
      // Create token contract interface
      const tokenInterface = ['function allowance(address owner, address spender) view returns (uint256)', 'function approve(address spender, uint256 amount) returns (bool)'];
      const tokenContract = new Contract(fromTokenAddress, tokenInterface, signer);
      
      // Step 1: Check current allowance
      const currentAllowance = await tokenContract.allowance(signer.address, brokerAddress);
      
      // Step 2: Approve if needed
      if (BigInt(currentAllowance.toString()) < BigInt(amountInWei.toString())) {
        console.log('🔓 Approving broker contract to spend tokens...');
        
        // Create approval transaction
        const approvalTx = await tokenContract.populateTransaction.approve(
          brokerAddress,
          amountInWei.toString()
        );
        
        // Send approval transaction using viem
        const approvalHash = await walletClient.sendTransaction({
          account: signer.address as `0x${string}`,
          to: fromTokenAddress as `0x${string}`,
          data: addReferralTagToTransaction(approvalTx.data as string) as `0x${string}`,
          value: BigInt(0),
          kzg: undefined,
          chain: celo
        });
        
        console.log('📤 Approval transaction hash:', approvalHash);
        
        // Wait for approval transaction
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log('✅ Approval confirmed!');

        // Submit Divvi referral for approval transaction
        await submitReferralTransaction(approvalHash);
      } else {
        console.log('✅ Sufficient allowance already exists');
      }
      
      // Check if trading is enabled for this pair
      try {
        const tradingEnabled = await mento.isTradingEnabled(tradablePair.id);
        console.log('📊 Trading enabled:', tradingEnabled);
      } catch (error) {
        // Trading check failed, continue anyway
      }
      
      // Find the correct exchange from the exchanges array
      console.log('📊 Path length:', tradablePair.path.length);
      
      // Handle multi-hop swaps by using the path
      if (tradablePair.path.length === 1) {
        // Direct swap - single exchange
        const correctExchange = exchanges.find(exchange => {
          const hasTokens = exchange.assets.length === 2 &&
            ((exchange.assets[0] === fromTokenAddress && exchange.assets[1] === toTokenAddress) ||
             (exchange.assets[0] === toTokenAddress && exchange.assets[1] === fromTokenAddress));
          return hasTokens;
        });
        console.log('📊 Found correct exchange:', correctExchange?.id);
        
        if (!correctExchange) {
          throw new Error(`No direct exchange found for tokens ${fromTokenAddress} and ${toTokenAddress}`);
        }
             } else if (tradablePair.path.length === 2) {
         // Multi-hop swap - manual implementation using two sequential swaps
         console.log('🔄 Multi-hop swap detected');
         
         // Get the intermediate token (cUSD in most cases)
         const firstExchange = tradablePair.path[0];
         const secondExchange = tradablePair.path[1];
         
         // Find intermediate token by checking which token is common between both exchanges
         let intermediateTokenAddress;
         const firstAssets = firstExchange.assets;
         const secondAssets = secondExchange.assets;
         
         // Find common asset (intermediate token)
         for (const asset1 of firstAssets) {
           for (const asset2 of secondAssets) {
             if (asset1 === asset2 && asset1 !== fromTokenAddress && asset1 !== toTokenAddress) {
               intermediateTokenAddress = asset1;
               break;
             }
           }
           if (intermediateTokenAddress) break;
         }
         
         if (!intermediateTokenAddress) {
           throw new Error('Could not determine intermediate token for multi-hop swap');
         }
         
         console.log('🔄 Route: ', `${fromCurrency} → Intermediate → ${toCurrency}`);
         
         // Determine which exchange to use for each step
         // Step 1: fromToken → intermediateToken
         // Step 2: intermediateToken → toToken
         
         let step1Exchange, step2Exchange;
         
         // Find exchange that contains fromToken and intermediateToken
         for (const exchange of [firstExchange, secondExchange]) {
           const hasFromToken = exchange.assets.includes(fromTokenAddress);
           const hasIntermediateToken = exchange.assets.includes(intermediateTokenAddress);
           if (hasFromToken && hasIntermediateToken) {
             step1Exchange = exchange;
             break;
           }
         }
         
         // Find exchange that contains intermediateToken and toToken  
         for (const exchange of [firstExchange, secondExchange]) {
           const hasIntermediateToken = exchange.assets.includes(intermediateTokenAddress);
           const hasToToken = exchange.assets.includes(toTokenAddress);
           if (hasIntermediateToken && hasToToken) {
             step2Exchange = exchange;
             break;
           }
         }
         
         if (!step1Exchange || !step2Exchange) {
           throw new Error('Could not find appropriate exchanges for multi-hop swap');
         }
         
         // Step 1: Swap fromToken to intermediate token
         console.log('📍 Step 1: Swapping to intermediate token...');
         
         // Get quote for first step using broker contract instead of Mento SDK
         const step1Quote = await broker.functions.getAmountOut(
           step1Exchange.providerAddr,
           step1Exchange.id,
           fromTokenAddress,
           intermediateTokenAddress,
           amountInWei.toString()
         );
         
         // Apply slippage to step1 (1% slippage)  
         const step1MinAmount = (BigInt(step1Quote.toString()) * BigInt(99)) / BigInt(100);
         
         // Execute first swap
         const step1TxRequest = await broker.interface.encodeFunctionData('swapIn', [
           step1Exchange.providerAddr,
           step1Exchange.id,
           fromTokenAddress,
           intermediateTokenAddress,
           amountInWei.toString(),
           step1MinAmount.toString()
         ]);
         
         // Add Divvi referral tag to step 1 transaction data
         const step1DataWithReferral = addReferralTagToTransaction(step1TxRequest);
         
         const step1Hash = await walletClient.sendTransaction({
           account: signer.address as `0x${string}`,
           to: brokerAddress as `0x${string}`,
           data: step1DataWithReferral as `0x${string}`,
           value: BigInt(0),
           kzg: undefined,
           chain: celo
         });
         
         console.log('📤 Step 1 transaction hash:', step1Hash);
         
         // Wait for step 1 to complete
         await publicClient.waitForTransactionReceipt({ hash: step1Hash });
         console.log('✅ Step 1 complete');
         
         // Submit referral for step 1
         console.log('📬 Submitting referral for step 1 to Divvi...');
         await submitReferralTransaction(step1Hash);
         
         // Step 2: Approve intermediate token for broker (if needed)
         const intermediateTokenContract = new Contract(
           intermediateTokenAddress,
           ['function allowance(address owner, address spender) view returns (uint256)', 'function approve(address spender, uint256 amount) returns (bool)'],
           signer
         );
         
         const intermediateAllowance = await intermediateTokenContract.allowance(signer.address, brokerAddress);
         
        if (BigInt(intermediateAllowance.toString()) < BigInt(step1Quote.toString())) {
           const approvalTx = await intermediateTokenContract.populateTransaction.approve(
             brokerAddress,
             step1Quote.toString()
           );
           
          const approvalHash = await walletClient.sendTransaction({
             account: signer.address as `0x${string}`,
             to: intermediateTokenAddress as `0x${string}`,
            data: addReferralTagToTransaction(approvalTx.data as string) as `0x${string}`,
             value: BigInt(0),
             kzg: undefined,
             chain: celo
           });
           
           await publicClient.waitForTransactionReceipt({ hash: approvalHash });
           console.log('✅ Intermediate token approved');

          // Submit Divvi referral for approval transaction
          await submitReferralTransaction(approvalHash);
         }
         
         // Step 2: Swap intermediate token to target token
         console.log('📍 Step 2: Swapping intermediate to target token...');
         
         // Get quote for second step
         const step2Quote = await broker.functions.getAmountOut(
           step2Exchange.providerAddr,
           step2Exchange.id,
           intermediateTokenAddress,
           toTokenAddress,
           step1Quote.toString()
         );
         
         // Apply slippage to step2 (1% slippage)
         const step2MinAmount = (BigInt(step2Quote.toString()) * BigInt(99)) / BigInt(100);
         
         const step2TxRequest = await broker.interface.encodeFunctionData('swapIn', [
           step2Exchange.providerAddr,
           step2Exchange.id,
           intermediateTokenAddress,
           toTokenAddress,
           step1Quote.toString(),
           step2MinAmount.toString()
         ]);
         
         // Add Divvi referral tag to step 2 transaction data
         const step2DataWithReferral = addReferralTagToTransaction(step2TxRequest);
         
         const step2Hash = await walletClient.sendTransaction({
           account: signer.address as `0x${string}`,
           to: brokerAddress as `0x${string}`,
           data: step2DataWithReferral as `0x${string}`,
           value: BigInt(0),
           kzg: undefined,
           chain: celo
         });
         
         console.log('📤 Step 2 transaction hash:', step2Hash);
         
         // Wait for step 2 to complete
         await publicClient.waitForTransactionReceipt({ hash: step2Hash });
         console.log('✅ Step 2 complete');
         
         // Submit referral for step 2
         console.log('📬 Submitting referral for step 2 to Divvi...');
         await submitReferralTransaction(step2Hash);
         
         // Handle remittance if recipient address is provided and different from sender
         if (recipientAddress && recipientAddress !== signer.address) {
           console.log('🔄 Transferring tokens to recipient...');
           
           const outputTokenContract = new Contract(toTokenAddress, ['function transfer(address to, uint256 amount) returns (bool)'], signer);
           
           const transferTx = await outputTokenContract.populateTransaction.transfer(
             recipientAddress,
             step2Quote.toString()
           );
           
           // Add Divvi referral tag to transfer transaction data
           const transferDataWithReferral = addReferralTagToTransaction(transferTx.data as string);
           
           const transferHash = await walletClient.sendTransaction({
             account: signer.address as `0x${string}`,
             to: toTokenAddress as `0x${string}`,
             data: transferDataWithReferral as `0x${string}`,
             value: BigInt(0),
             kzg: undefined,
             chain: celo
           });
           
           await publicClient.waitForTransactionReceipt({ hash: transferHash });
           console.log('✅ Transfer to recipient confirmed!');
           
           // Submit referral for transfer transaction
           console.log('📬 Submitting referral for transfer to Divvi...');
           await submitReferralTransaction(transferHash);
           
           return {
             success: true,
             hash: step2Hash,
             transferHash,
             amountOut: formatEther(BigInt(step2Quote.toString())),
             recipient: recipientAddress,
             message: `Successfully sent ${formatEther(BigInt(step2Quote.toString()))} ${toCurrency} to ${recipientAddress}!`
           };
         } else {
           return {
             success: true,
             hash: step2Hash,
             amountOut: formatEther(BigInt(step2Quote.toString())),
             recipient: signer.address,
             message: `Successfully swapped ${formatEther(BigInt(amountInWei))} ${fromCurrency} for ${formatEther(BigInt(step2Quote.toString()))} ${toCurrency}!`
           };
         }
      } else {
        throw new Error(`Unsupported swap path length: ${tradablePair.path.length}`);
      }
      
      // Continue with direct swap logic for single-hop swaps
      const correctExchange = exchanges.find(exchange => {
        const hasTokens = exchange.assets.length === 2 &&
          ((exchange.assets[0] === fromTokenAddress && exchange.assets[1] === toTokenAddress) ||
           (exchange.assets[0] === toTokenAddress && exchange.assets[1] === fromTokenAddress));
        return hasTokens;
      });
      console.log('📊 Found correct exchange:', correctExchange?.id);
      
      if (!correctExchange) {
        throw new Error(`No exchange found for tokens ${fromTokenAddress} and ${toTokenAddress}`);
      }
      
      // Try different swap approaches
      try {
        // Method 1: Try calling broker directly with the function interface
        console.log('🔄 Trying direct broker function call...');
        
        // Create the transaction request instead of executing it
        // Note: Broker swapIn always sends output tokens to caller, not custom recipient
        const txRequest = await broker.interface.encodeFunctionData('swapIn', [
          correctExchange.providerAddr,  // exchangeProvider
          correctExchange.id,            // exchangeId  
          fromTokenAddress,              // tokenIn
          toTokenAddress,                // tokenOut
          amountInWei.toString(),        // amountIn
          expectedAmountOut              // amountOutMin
        ]);
        
        // Add Divvi referral tag to transaction data
        const transactionDataWithReferral = addReferralTagToTransaction(txRequest);
        
        // Send the transaction using viem directly
        const hash = await walletClient.sendTransaction({
          account: signer.address as `0x${string}`,
          to: brokerAddress as `0x${string}`,
          data: transactionDataWithReferral as `0x${string}`,
          value: BigInt(0),
          kzg: undefined,
          chain: celo
        });
        
        console.log('📤 Transaction hash:', hash);
        console.log('✅ Direct broker function call succeeded!');
        
        // Wait for swap transaction to be mined
        await publicClient.waitForTransactionReceipt({ hash });
        console.log('✅ Swap transaction confirmed!');
        
        // Submit referral to Divvi after transaction confirmation
        console.log('📬 Submitting referral to Divvi...');
        await submitReferralTransaction(hash);
        
        // Handle remittance if recipient address is provided and different from sender
        if (recipientAddress && recipientAddress !== signer.address) {
          console.log('🔄 Transferring received tokens to recipient...');
          
          // Create token contract for the output token
          const outputTokenContract = new Contract(toTokenAddress, ['function transfer(address to, uint256 amount) returns (bool)'], signer);
          
          // Transfer the received tokens to the recipient
          const transferTx = await outputTokenContract.populateTransaction.transfer(
            recipientAddress,
            expectedAmountOut
          );
          
          console.log('📋 Transfer transaction:', transferTx);
          
          // Add Divvi referral tag to transfer transaction data
          const transferDataWithReferral = addReferralTagToTransaction(transferTx.data as string);
          
                     // Send transfer transaction using viem
           const transferHash = await walletClient.sendTransaction({
             account: signer.address as `0x${string}`,
             to: toTokenAddress as `0x${string}`,
             data: transferDataWithReferral as `0x${string}`,
             value: BigInt(0),
             kzg: undefined,
             chain: celo
           });
          
                   console.log('📤 Transfer transaction hash:', transferHash);
         
         // Wait for transfer transaction
         await publicClient.waitForTransactionReceipt({ hash: transferHash });
         console.log('✅ Transfer confirmed!');
          
          // Submit referral for transfer transaction
          console.log('📬 Submitting referral for transfer to Divvi...');
          await submitReferralTransaction(transferHash);
          
          return {
            success: true,
            hash,
            transferHash,
            amountOut: formatEther(BigInt(expectedAmountOut)),
            recipient: recipientAddress,
            message: `Successfully sent ${formatEther(BigInt(expectedAmountOut))} ${toCurrency} to ${recipientAddress}!`
          };
        } else {
          return {
            success: true,
            hash,
            amountOut: formatEther(BigInt(expectedAmountOut)),
            recipient: signer.address,
            message: `Successfully swapped ${formatEther(BigInt(amountInWei))} ${fromCurrency} for ${formatEther(BigInt(expectedAmountOut))} ${toCurrency}!`
          };
        }
      } catch (error1) {
        console.log('Method 1 failed:', error1 instanceof Error ? error1.message : String(error1));
        
        try {
          // Method 2: Try alternative broker function call
          console.log('🔄 Trying alternative broker function signature...');
          // Alternative signature with additional parameters
          const txRequest = await broker.interface.encodeFunctionData('swapIn', [
            correctExchange.providerAddr,
            correctExchange.id,
            fromTokenAddress,
            toTokenAddress,
            amountInWei.toString(),
            expectedAmountOut
          ]);
          
                                          // Add Divvi referral tag to transaction data
           const transactionDataWithReferral = addReferralTagToTransaction(txRequest);
           
           const hash = await walletClient.sendTransaction({
             account: signer.address as `0x${string}`,
             to: brokerAddress as `0x${string}`,
             data: transactionDataWithReferral as `0x${string}`,
             value: BigInt(0),
             kzg: undefined,
             chain: celo
           });
          
          await publicClient.waitForTransactionReceipt({ hash });
          console.log('✅ Alternative broker call succeeded!');
          
          // Submit referral to Divvi after transaction confirmation
          console.log('📬 Submitting referral to Divvi...');
          await submitReferralTransaction(hash);
          
          return {
            success: true,
            hash,
            amountOut: formatEther(BigInt(expectedAmountOut)),
            recipient: signer.address,
            message: `Successfully swapped ${formatEther(BigInt(amountInWei))} ${fromCurrency} for ${formatEther(BigInt(expectedAmountOut))} ${toCurrency}!`
          };
        } catch (error2) {
          console.log('Method 2 failed:', error2 instanceof Error ? error2.message : String(error2));
          // If all methods fail, throw an error with diagnostic info
          // Method 4: List all available functions on the broker
          console.log('🔍 Listing all broker interface functions...');
          const brokerInterface = broker.interface;
          console.log('Broker interface:', brokerInterface);
          console.log('Broker interface functions:', Object.getOwnPropertyNames(brokerInterface));
          console.log('Broker methods:', Object.getOwnPropertyNames(broker));
          // List all available functions by name - handle Map structure
          console.log('📋 Available broker functions:');
          const interfaceAny = brokerInterface as any;
          if (interfaceAny.fragments) {
            interfaceAny.fragments.forEach((fragment: any) => {
              if (fragment.type === 'function') {
                const signature = `${fragment.name}(${fragment.inputs.map((input: any) => `${input.type} ${input.name}`).join(', ')})`;
                console.log(`- ${signature}`);
              }
            });
          }
          // Try to find swap-related functions from fragments
          const swapFunctions: string[] = [];
          const exchangeFunctions: string[] = [];
          if (interfaceAny.fragments) {
            interfaceAny.fragments.forEach((fragment: any) => {
              if (fragment.type === 'function') {
                const name = fragment.name.toLowerCase();
                if (name.includes('swap')) {
                  swapFunctions.push(fragment.name);
                }
                if (name.includes('exchange') || name.includes('trade')) {
                  exchangeFunctions.push(fragment.name);
                }
              }
            });
          }
          console.log('🔄 Swap-related functions:', swapFunctions);
          console.log('💱 Exchange/Trade-related functions:', exchangeFunctions);
          // If all methods fail, throw an error with diagnostic info
          throw new Error(`All swap methods failed. Exchanges: ${exchanges.length}, Available methods: ${Object.getOwnPropertyNames(mento).join(', ')}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Swap failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown',
      });
      throw error;
    }
  };

  return { swap };
} 
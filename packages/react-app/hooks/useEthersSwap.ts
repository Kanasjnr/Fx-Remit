import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Contract, ethers } from 'ethers';
import {
  Currency,
  getTokenAddress,
  getContractV2Address,
} from '../lib/contracts';
import { useDivvi } from './useDivvi';
import FXRemitV2ABI from '../ABI/FXRemitV2.json';
import {
  PERMIT2_TYPES,
  getPermit2Domain,
  createPermit2Message,
  checkPermit2Approval,
  approvePermit2,
  getPermit2Nonce,
} from '../lib/permit2';

const CELO_CHAIN_ID = 42220;
const CELO_RPC = 'https://forno.celo.org';
const SLIPPAGE_TOLERANCE = 98;
const PERMIT_DEADLINE_HOURS = 1;

const DECIMALS_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface SwapParams {
  fromCurrency: Currency;
  toCurrency: Currency;
  amount: string;
  minAmountOut?: string;
  recipientAddress?: string;
}

interface SwapResult {
  success: boolean;
  pending?: boolean;
  hash?: string;
  callsId?: string;
  amountOut: string;
  recipient: string;
  message: string;
}

async function setupWallet(address: string | undefined) {
  if (!window.ethereum) {
    throw new Error('No wallet found. Please install a Web3 wallet.');
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const ethersProvider = new providers.Web3Provider(window.ethereum);
  const signer = ethersProvider.getSigner();
  const signerAddress = await signer.getAddress();

  if (signerAddress.toLowerCase() !== address?.toLowerCase()) {
    throw new Error('Wallet address mismatch');
  }

  const network = await ethersProvider.getNetwork();
  if (network.chainId !== CELO_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CELO_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        throw new Error('Please add Celo network to your wallet');
      }
      throw new Error('Please switch your wallet to Celo network');
    }
  }

  return { signerAddress, signer };
}

async function getTokenDecimals(
  tokenAddress: string,
  provider: providers.JsonRpcProvider
) {
  const tokenContract = new Contract(tokenAddress, DECIMALS_ABI, provider);
  return await tokenContract.decimals();
}

async function calculateSwapAmounts(
  mento: Mento,
  fromToken: string,
  toToken: string,
  amount: string,
  fromDecimals: number,
  toDecimals: number,
  minAmountOut?: string
) {
  const amountInWei = ethers.utils.parseUnits(amount, fromDecimals);
  const quoteAmountOut = await mento.getAmountOut(
    fromToken,
    toToken,
    amountInWei.toString()
  );

  const quoteBigInt = BigInt(quoteAmountOut.toString());
  const expectedAmountOut = minAmountOut
    ? ethers.utils.parseUnits(minAmountOut, toDecimals).toString()
    : ((quoteBigInt * BigInt(SLIPPAGE_TOLERANCE)) / BigInt(100)).toString();

  const formattedAmountOut = ethers.utils.formatUnits(
    expectedAmountOut,
    toDecimals
  );

  return {
    amountInWei,
    expectedAmountOut,
    formattedAmountOut,
  };
}

async function preparePermit2(
  provider: providers.JsonRpcProvider,
  signer: any,
  fromTokenAddress: string,
  signerAddress: string,
  amountInWei: ethers.BigNumber,
  fxRemitV2Address: string,
  chainId: number
) {
  const permit2Allowance = await checkPermit2Approval(
    provider,
    fromTokenAddress,
    signerAddress,
    ethers
  );

  if (permit2Allowance < BigInt(amountInWei.toString())) {
    await approvePermit2(signer, fromTokenAddress, ethers);
  }

  const deadline = Math.floor(Date.now() / 1000) + PERMIT_DEADLINE_HOURS * 3600;
  // Get nonce from Permit2 contract (per-user nonces tracked by Permit2)
  const nonce = await getPermit2Nonce(provider, signerAddress);
  const permit2Message = createPermit2Message(
    fromTokenAddress,
    amountInWei.toString(),
    fxRemitV2Address,
    nonce,
    deadline.toString()
  );
  const permit2Domain = getPermit2Domain(chainId);

  const permitSignature = await signer._signTypedData(
    permit2Domain,
    PERMIT2_TYPES,
    permit2Message
  );

  return { permitSignature, nonce, deadline };
}

function findMultiHopPath(
  tradablePair: any,
  fromTokenAddress: string,
  toTokenAddress: string
) {
  if (tradablePair.path.length !== 2) return null;

  const firstHop = tradablePair.path[0].assets.includes(fromTokenAddress)
    ? tradablePair.path[0]
    : tradablePair.path[1];
  const secondHop =
    firstHop === tradablePair.path[0]
      ? tradablePair.path[1]
      : tradablePair.path[0];

  if (
    !firstHop.assets.includes(fromTokenAddress) ||
    !secondHop.assets.includes(toTokenAddress)
  ) {
    return null;
  }

  const intermediateToken = firstHop.assets.find(
    (asset: string) =>
      secondHop.assets.includes(asset) &&
      asset !== fromTokenAddress &&
      asset !== toTokenAddress
  );

  if (!intermediateToken) return null;

  return { firstHop, secondHop, intermediateToken };
}

async function executeSingleHopSwap(
  params: SwapParams,
  swapData: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amountInWei: ethers.BigNumber;
    expectedAmountOut: string;
    formattedAmountOut: string;
    fromCurrencyForSwap: string;
    toCurrencyForSwap: string;
    corridor: string;
    permitSignature: string;
    nonce: string;
    deadline: number;
    hop: any;
    fxRemitV2Address: string;
    recipientAddress: string;
    signerAddress: string;
  },
  signer: any,
  addReferralTagToTransaction: (data: string) => string,
  submitReferralTransaction: (hash: string) => Promise<void>
): Promise<SwapResult> {
  const {
    fromTokenAddress,
    toTokenAddress,
    amountInWei,
    expectedAmountOut,
    formattedAmountOut,
    fromCurrencyForSwap,
    toCurrencyForSwap,
    corridor,
    permitSignature,
    nonce,
    deadline,
    hop,
    fxRemitV2Address,
    recipientAddress,
  } = swapData;

  const fxRemitContract = new Contract(fxRemitV2Address, FXRemitV2ABI, signer);
  const swapTx = await fxRemitContract.populateTransaction.swapAndSend(
    recipientAddress,
    fromTokenAddress,
    toTokenAddress,
    amountInWei,
    expectedAmountOut,
    fromCurrencyForSwap,
    toCurrencyForSwap,
    corridor,
    hop.providerAddr,
    hop.id,
    nonce,
    deadline,
    permitSignature
  );

  const dataWithReferral = addReferralTagToTransaction(swapTx.data!);
  swapTx.data = dataWithReferral;

  const gasEstimate = await signer.estimateGas(swapTx);
  swapTx.gasLimit = gasEstimate.mul(120).div(100);

  const swapResponse = await signer.sendTransaction(swapTx);
  const receipt = await swapResponse.wait(1);

  if (receipt.status !== 1) {
    throw new Error('Swap transaction failed');
  }

  await submitReferralTransaction(swapResponse.hash);

  return {
    success: true,
    hash: swapResponse.hash,
    amountOut: formattedAmountOut,
    recipient: recipientAddress,
    message: `Sent ${params.amount} ${params.fromCurrency} → ${params.toCurrency}`,
  };
}

async function executeMultiHopSwap(
  params: SwapParams,
  swapData: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amountInWei: ethers.BigNumber;
    expectedAmountOut: string;
    formattedAmountOut: string;
    fromCurrencyForSwap: string;
    toCurrencyForSwap: string;
    corridor: string;
    permitSignature: string;
    nonce: string;
    deadline: number;
    hop1: any;
    hop2: any;
    intermediateTokenAddress: string;
    fxRemitV2Address: string;
    recipientAddress: string;
    signerAddress: string;
  },
  signer: any,
  mento: Mento,
  addReferralTagToTransaction: (data: string) => string,
  submitReferralTransaction: (hash: string) => Promise<void>
): Promise<SwapResult> {
  const {
    fromTokenAddress,
    toTokenAddress,
    amountInWei,
    expectedAmountOut,
    formattedAmountOut,
    fromCurrencyForSwap,
    toCurrencyForSwap,
    corridor,
    permitSignature,
    nonce,
    deadline,
    hop1,
    hop2,
    intermediateTokenAddress,
    fxRemitV2Address,
    recipientAddress,
  } = swapData;

  const intermediateAmountQuote = await mento.getAmountOut(
    fromTokenAddress,
    intermediateTokenAddress,
    amountInWei.toString()
  );

  const minIntermediateOut = (
    (BigInt(intermediateAmountQuote.toString()) * BigInt(SLIPPAGE_TOLERANCE)) /
    BigInt(100)
  ).toString();

  const fxRemitContract = new Contract(fxRemitV2Address, FXRemitV2ABI, signer);
  const swapTx = await fxRemitContract.populateTransaction.swapAndSendPath(
    recipientAddress,
    fromTokenAddress,
    intermediateTokenAddress,
    toTokenAddress,
    amountInWei,
    minIntermediateOut,
    expectedAmountOut,
    fromCurrencyForSwap,
    toCurrencyForSwap,
    corridor,
    hop1.providerAddr,
    hop1.id,
    hop2.providerAddr,
    hop2.id,
    nonce,
    deadline,
    permitSignature
  );

  const dataWithReferral = addReferralTagToTransaction(swapTx.data!);
  swapTx.data = dataWithReferral;

  const gasEstimate = await signer.estimateGas(swapTx);
  swapTx.gasLimit = gasEstimate.mul(120).div(100);

  const swapResponse = await signer.sendTransaction(swapTx);
  const receipt = await swapResponse.wait(1);

  if (receipt.status !== 1) {
    throw new Error('Multi-hop swap transaction failed');
  }

  await submitReferralTransaction(swapResponse.hash);

  return {
    success: true,
    hash: swapResponse.hash,
    amountOut: formattedAmountOut,
    recipient: recipientAddress,
    message: `Sent ${params.amount} ${params.fromCurrency} → ${params.toCurrency}`,
  };
}

export function useEthersSwap() {
  const { address, isConnected } = useAccount();
  const { addReferralTagToTransaction, submitReferralTransaction } = useDivvi();

  const walletReadiness = useMemo(
    () => ({
      isConnected: isConnected && !!address,
      isFullyReady: isConnected && !!address && !!window.ethereum,
    }),
    [isConnected, address]
  );

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: string,
    minAmountOut?: string,
    recipientAddress?: string
  ): Promise<SwapResult> => {
    if (!walletReadiness.isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!address) {
      throw new Error('Wallet address not available');
    }

    const chainId = CELO_CHAIN_ID;
    const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
    const toTokenAddress = getTokenAddress(chainId, toCurrency);

    const provider = new providers.JsonRpcProvider(CELO_RPC);
    const { signerAddress, signer } = await setupWallet(address);

    const mento = await Mento.create(provider);
    const exchanges = await mento.getExchanges();

    if (exchanges.length === 0) {
      throw new Error('No exchanges available');
    }

    const [fromDecimals, toDecimals] = await Promise.all([
      getTokenDecimals(fromTokenAddress, provider),
      getTokenDecimals(toTokenAddress, provider),
    ]);

    const { amountInWei, expectedAmountOut, formattedAmountOut } =
      await calculateSwapAmounts(
        mento,
        fromTokenAddress,
        toTokenAddress,
        amount,
        fromDecimals,
        toDecimals,
        minAmountOut
      );

    const fxRemitV2Address = getContractV2Address(chainId);
    if (!fxRemitV2Address) {
      throw new Error('FXRemitV2 address not configured');
    }

    const { permitSignature, nonce, deadline } = await preparePermit2(
      provider,
      signer,
      fromTokenAddress,
      signerAddress,
      amountInWei,
      fxRemitV2Address,
      chainId
    );

    const fxRemitContract = new Contract(fxRemitV2Address, FXRemitV2ABI, provider);
    const [contractFromSymbol, contractToSymbol] = await Promise.all([
      fxRemitContract.getTokenSymbol(fromTokenAddress),
      fxRemitContract.getTokenSymbol(toTokenAddress),
    ]);

    const tradablePair = await mento.findPairForTokens(
      fromTokenAddress,
      toTokenAddress
    );

    if (!tradablePair) {
      throw new Error(
        `No tradable pair found for ${fromCurrency} → ${toCurrency}`
      );
    }

    const corridor = `${contractFromSymbol}-${contractToSymbol}`;
    const finalRecipient = recipientAddress ?? signerAddress;

    const swapData = {
      fromTokenAddress,
      toTokenAddress,
      amountInWei,
      expectedAmountOut,
      formattedAmountOut,
      fromCurrencyForSwap: contractFromSymbol,
      toCurrencyForSwap: contractToSymbol,
      corridor,
      permitSignature,
      nonce,
      deadline,
      fxRemitV2Address,
      recipientAddress: finalRecipient,
      signerAddress,
    };

    const params: SwapParams = {
      fromCurrency,
      toCurrency,
      amount,
      minAmountOut,
      recipientAddress: finalRecipient,
    };

    if (tradablePair.path.length === 1) {
      const hop = tradablePair.path[0];
      return await executeSingleHopSwap(
        params,
        { ...swapData, hop },
        signer,
        addReferralTagToTransaction,
        submitReferralTransaction
      );
    }

    const multiHopPath = findMultiHopPath(
      tradablePair,
      fromTokenAddress,
      toTokenAddress
    );

    if (!multiHopPath) {
      throw new Error('Could not determine swap path');
    }

    const { firstHop: hop1, secondHop: hop2, intermediateToken } =
      multiHopPath;

    const assets1 = hop1.assets;
    const assets2 = hop2.assets;

    const intermediateTokenAddress = assets1.find(
      (a1: string) =>
        assets2.includes(a1) &&
        a1 !== fromTokenAddress &&
        a1 !== toTokenAddress
    );

    if (!intermediateTokenAddress) {
      throw new Error('Could not determine intermediate token');
    }

    if (
      !assets1.includes(fromTokenAddress) ||
      !assets1.includes(intermediateTokenAddress) ||
      !assets2.includes(intermediateTokenAddress) ||
      !assets2.includes(toTokenAddress)
    ) {
      throw new Error('Invalid swap path');
    }

    return await executeMultiHopSwap(
      params,
      { ...swapData, hop1, hop2, intermediateTokenAddress },
      signer,
      mento,
      addReferralTagToTransaction,
      submitReferralTransaction
    );
  };

  return {
    swap,
    isWalletReady: walletReadiness.isFullyReady,
    walletStatus: walletReadiness,
  };
}

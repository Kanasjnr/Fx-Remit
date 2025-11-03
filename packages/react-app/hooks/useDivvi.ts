import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

const DIVVI_CONSUMER_ADDRESS = '0x817c19bD1Ba4eD47e180a3219d12d1462C8fABDC';

export function useDivvi() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const generateReferralTag = () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    return getReferralTag({
      user: address,
      consumer: DIVVI_CONSUMER_ADDRESS,
    });
  };

  const submitReferralTransaction = async (txHash: string) => {
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    try {
      const chainId = await walletClient.getChainId();
      
      await submitReferral({
        txHash: txHash as `0x${string}`,
        chainId,
      });
      
      console.log(' Divvi referral submitted successfully:', { txHash, chainId });
    } catch (error) {
      console.error(' Failed to submit Divvi referral:', error);
    }
  };

  const addReferralTagToTransaction = (transactionData: string) => {
    try {
      const referralTag = generateReferralTag();
      return transactionData + referralTag;
    } catch (error) {
      console.error(' Failed to generate referral tag:', error);
      return transactionData;
    }
  };

  return {
    generateReferralTag,
    submitReferralTransaction,
    addReferralTagToTransaction,
  };
} 
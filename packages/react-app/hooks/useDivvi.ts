import { useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

const DIVVI_CONSUMER_ADDRESS = '0xa1599790B763E537bd15b5b912012e5Fb65491a3';

export function useDivvi() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const generateReferralTag = useCallback((): string => {
    if (!address) {
      throw new Error('User address is required to generate referral tag');
    }

    const referralTag = getReferralTag({
      user: address,
      consumer: DIVVI_CONSUMER_ADDRESS,
    });

    return referralTag;
  }, [address]);

  const submitReferralTransaction = useCallback(async (txHash: string) => {
    if (!walletClient) {
      throw new Error('Wallet client is required to submit referral');
    }

    const chainId = await walletClient.getChainId();
    
    await submitReferral({
      txHash: txHash as `0x${string}`,
      chainId,
    });
  }, [walletClient]);

  return {
    generateReferralTag,
    submitReferralTransaction,
    isReady: !!address && !!walletClient,
  };
} 
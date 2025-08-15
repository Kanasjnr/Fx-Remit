import { renderHook } from '@testing-library/react';
import { useDivvi } from '../../hooks/useDivvi';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

// Mock the Divvi SDK
jest.mock('@divvi/referral-sdk', () => ({
  getReferralTag: jest.fn(),
  submitReferral: jest.fn(),
}));

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
  }),
  useWalletClient: () => ({
    data: {
      getChainId: jest.fn().mockResolvedValue(42220),
    },
  }),
  usePublicClient: () => ({}),
}));

describe('useDivvi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate referral tag correctly', () => {
    const mockReferralTag = '0x1234567890abcdef';
    (getReferralTag as jest.Mock).mockReturnValue(mockReferralTag);

    const { result } = renderHook(() => useDivvi());
    const referralTag = result.current.generateReferralTag();

    expect(getReferralTag).toHaveBeenCalledWith({
      user: '0x1234567890123456789012345678901234567890',
      consumer: '0x817c19bD1Ba4eD47e180a3219d12d1462C8fABDC',
    });
    expect(referralTag).toBe(mockReferralTag);
  });

  it('should add referral tag to transaction data', () => {
    const mockReferralTag = '0x1234567890abcdef';
    (getReferralTag as jest.Mock).mockReturnValue(mockReferralTag);

    const { result } = renderHook(() => useDivvi());
    const originalData = '0xabcdef1234567890';
    const resultData = result.current.addReferralTagToTransaction(originalData);

    expect(resultData).toBe(originalData + mockReferralTag);
  });

  it('should submit referral transaction', async () => {
    const mockSubmitReferral = submitReferral as jest.Mock;
    mockSubmitReferral.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDivvi());
    const txHash = '0xabcdef1234567890';
    
    await result.current.submitReferralTransaction(txHash);

    expect(mockSubmitReferral).toHaveBeenCalledWith({
      txHash: txHash as `0x${string}`,
      chainId: 42220,
    });
  });

  it('should handle errors gracefully in addReferralTagToTransaction', () => {
    (getReferralTag as jest.Mock).mockImplementation(() => {
      throw new Error('Failed to generate tag');
    });

    const { result } = renderHook(() => useDivvi());
    const originalData = '0xabcdef1234567890';
    const resultData = result.current.addReferralTagToTransaction(originalData);

    // Should return original data if referral tag generation fails
    expect(resultData).toBe(originalData);
  });

  it('should handle errors gracefully in submitReferralTransaction', async () => {
    const mockSubmitReferral = submitReferral as jest.Mock;
    mockSubmitReferral.mockRejectedValue(new Error('Failed to submit'));

    const { result } = renderHook(() => useDivvi());
    const txHash = '0xabcdef1234567890';
    
    // Should not throw error
    await expect(result.current.submitReferralTransaction(txHash)).resolves.not.toThrow();
  });
}); 
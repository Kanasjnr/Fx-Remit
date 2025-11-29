
import { providers, Contract, ethers } from 'ethers';

export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export const PERMIT2_TYPES = {
  PermitTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
  TokenPermissions: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
} as const;

export function getPermit2Domain(chainId: number) {
  return {
    name: 'Permit2',
    chainId: chainId,
    verifyingContract: PERMIT2_ADDRESS as `0x${string}`,
  };
}

export function createPermit2Message(
  tokenAddress: string,
  amount: string,
  spender: string,
  nonce: string,
  deadline: string
) {
  return {
    permitted: {
      token: tokenAddress as `0x${string}`,
      amount: amount,
    },
    spender: spender as `0x${string}`,
    nonce: nonce,
    deadline: deadline,
  };
}

const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;


export async function checkPermit2Approval(
  provider: providers.JsonRpcProvider,
  tokenAddress: string,
  userAddress: string,
  ethersLib: typeof ethers
): Promise<bigint> {
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
  const allowance = await tokenContract.allowance(userAddress, PERMIT2_ADDRESS);
  return BigInt(allowance.toString());
}


export async function approvePermit2(
  signer: any,
  tokenAddress: string,
  ethersLib: typeof ethers
): Promise<void> {
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
  const maxApproval = ethersLib.constants.MaxUint256;
  const tx = await tokenContract.approve(PERMIT2_ADDRESS, maxApproval);
  await tx.wait(1);
}


export async function getPermit2Nonce(
  provider: providers.JsonRpcProvider,
  userAddress: string
): Promise<string> {
  
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 1000000);
  const nonce = BigInt(timestamp) * BigInt(1000000) + BigInt(random);
  return nonce.toString();
}


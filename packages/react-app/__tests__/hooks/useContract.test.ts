import { renderHook } from '@testing-library/react'
import { useFXRemitContract, usePlatformStats } from '../../hooks/useContract'

// Mock wagmi hooks
const mockUseChainId = jest.fn()
const mockUseReadContract = jest.fn()

jest.mock('wagmi', () => ({
  useChainId: () => mockUseChainId(),
  useReadContract: () => mockUseReadContract(),
}))

describe('useFXRemitContract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChainId.mockReturnValue(42220) // Celo mainnet
  })

  it('should return contract instance with correct configuration', () => {
    const { result } = renderHook(() => useFXRemitContract())
    
    expect(result.current).toBeDefined()
    expect(result.current.chainId).toBe(42220)
    expect(result.current.isConfigured).toBe(true)
    expect(result.current.abi).toBeDefined()
  })

  it('should handle different chain IDs', () => {
    mockUseChainId.mockReturnValue(44787) // Alfajores testnet
    
    const { result } = renderHook(() => useFXRemitContract())
    
    expect(result.current.chainId).toBe(44787)
  })
})

describe('usePlatformStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChainId.mockReturnValue(42220)
  })

  it('should return platform statistics', () => {
    const mockStats = [
      BigInt('1000000000000000000000'), // totalVolume
      BigInt('15000000000000000000'),   // totalFees
      BigInt(100),                      // totalTransactions
      BigInt(100)                       // totalRemittances
    ]
    
    mockUseReadContract.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => usePlatformStats())
    
    expect(result.current.stats).toBeDefined()
    expect(result.current.stats?.totalVolume).toBe('1000.0')
    expect(result.current.stats?.totalFees).toBe('15.0')
    expect(result.current.stats?.totalTransactions).toBe(100)
  })

  it('should handle loading state', () => {
    mockUseReadContract.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    const { result } = renderHook(() => usePlatformStats())
    
    expect(result.current.isLoading).toBe(true)
  })

  it('should handle errors', () => {
    const mockError = new Error('Contract error')
    mockUseReadContract.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
    })

    const { result } = renderHook(() => usePlatformStats())
    
    expect(result.current.error).toBe(mockError)
  })
}) 
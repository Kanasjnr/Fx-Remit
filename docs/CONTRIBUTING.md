# Contributing to FX-Remit

Thank you for your interest in contributing to FX-Remit! This document provides comprehensive guidelines and instructions for contributing to the project. Please read it carefully before making any contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style and Standards](#code-style-and-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Smart Contract Development](#smart-contract-development)
- [Frontend Development](#frontend-development)
- [Community Guidelines](#community-guidelines)
- [Troubleshooting](#troubleshooting)
- [Communication Channels](#communication-channels)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js (v18 or later) - [Download here](https://nodejs.org/)
- pnpm (v8 or later) - [Install guide](https://pnpm.io/installation)
- Git - [Download here](https://git-scm.com/)
- A code editor (VS Code recommended) - [Download here](https://code.visualstudio.com/)
- MetaMask or Valora wallet - [MetaMask](https://metamask.io/) | [Valora](https://valoraapp.com/)
- Docker (optional, for containerized development) - [Download here](https://www.docker.com/)

### Initial Setup

1. **Fork the repository**
   - Go to [https://github.com/Kanasjnr/fx-remit](https://github.com/Kanasjnr/fx-remit)
   - Click the "Fork" button in the top right
   - This creates your own copy of the repository

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/fx-remit.git
   cd fx-remit
   ```

3. **Set up the upstream remote**
   ```bash
   git remote add upstream https://github.com/Kanasjnr/fx-remit.git
   git fetch upstream
   ```

4. **Install dependencies**
```bash
pnpm install
```

5. **Set up environment variables**
```bash
   # Copy environment files
   cp packages/react-app/.env.example packages/react-app/.env.local
   cp packages/hardhat/.env.example packages/hardhat/.env
   ```
   
   **⚠️ IMPORTANT**: Edit the `.env` files and replace all placeholder values with your actual credentials. Never commit real private keys or API keys to version control.

6. **Start the development environment**

   **Option A: Full Development Setup**
```bash
# Start frontend development server
pnpm react-app:dev

   # In another terminal, start hardhat node
pnpm hardhat:run:node

   # In a third terminal, deploy contracts to local network
pnpm hardhat:compile
pnpm --filter @fx-remit/hardhat run scripts/deploy.ts --network localhost
   ```

   **Option B: Quick Start**
   ```bash
   # Build and start everything
   pnpm build
   pnpm react-app:dev
   ```

7. **Verify your setup**
   - Frontend should be running at: http://localhost:3000
   - Hardhat node should be running at: http://localhost:8545
   - Contracts should be deployed and accessible

## Development Workflow

### Branch Strategy

- `main` - Production-ready code (default branch)
- `feat/ui-revamp` - Current active development branch 
- `staging` - Integration branch for features 
- `feat/farcaster-miniapp` - Farcaster MiniApp feature branch 
- `testing` - Testing and experimental features 
- `feature/*` - New feature development branches

### Creating a New Feature

1. **Update your local main branch**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a new feature branch from main**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the code style guidelines below
   - Write tests for new functionality
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
   
   **Commit Message Format:**
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Target the appropriate branch:
     - For UI changes: target `feat/ui-revamp`
     - For Farcaster features: target `feat/farcaster-miniapp`
     - For general features: target `staging`
     - For testing: target `testing`
   - Fill out the PR template
   - Request review from maintainers

### Working with Existing Feature Branches

If you want to contribute to existing feature branches:

```bash
# For UI revamp work
git checkout feat/ui-revamp
git pull upstream feat/ui-revamp
git checkout -b feature/your-ui-feature

# For Farcaster MiniApp work
git checkout feat/farcaster-miniapp
git pull upstream feat/farcaster-miniapp
git checkout -b feature/your-farcaster-feature

# For staging work
git checkout staging
git pull upstream staging
git checkout -b feature/your-staging-feature
```

### Keeping Your Fork Updated

```bash
# Update main branch
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Update specific feature branches
git checkout feat/ui-revamp
git pull upstream feat/ui-revamp
git push origin feat/ui-revamp

git checkout staging
git pull upstream staging
git push origin staging
```

## Code Style and Standards

### General Guidelines

- Write clear, self-documenting code
- Use meaningful variable and function names
- Keep functions small and focused (max 20-30 lines)
- Comment complex logic
- Follow the DRY (Don't Repeat Yourself) principle
- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Use ESLint and Prettier for code formatting
- Follow the Airbnb JavaScript Style Guide
- Use async/await over raw promises
- Use proper type annotations
- Avoid `any` type - use proper types or `unknown`

**Example:**
```typescript
// Good - Based on actual FX-Remit code
interface AssetOption {
  code: string;
  label: string;
  tokenLogo: string;
  countryFlag: string;
  balance?: number;
  usdValue?: number;
  symbol?: string;
}

const AssetPicker: React.FC<{
  open: boolean;
  title?: string;
  options: AssetOption[];
  onClose: () => void;
  onSelect: (code: string) => void;
}> = ({ open, title = "Select Asset", options, onClose, onSelect }) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Component implementation */}
      </Dialog>
    </Transition.Root>
  );
};

// Bad
const AssetPicker = (props: any) => {
  return <div>{props.options.map((opt: any) => opt.code)}</div>;
};
```

### Solidity

- Follow the Solidity Style Guide
- Use latest stable Solidity version (0.8.x)
- Implement proper access control
- Add NatSpec comments
- Use events for important state changes
- Implement proper error handling
- Use SafeMath (built into Solidity 0.8+)

**Example:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FXRemit
 * @dev Contract for logging and tracking cross-border remittances via Mento Protocol
 * @notice This contract tracks remittance transactions for analytics and user history
 */
contract FXRemit is ReentrancyGuard, Ownable, Pausable {
    
    struct Remittance {
        uint256 id;
        address sender;
        address recipient;
        address fromToken;
        address toToken;
        string fromCurrency;
        string toCurrency;
        uint256 amountSent;
        uint256 amountReceived;
        uint256 exchangeRate;
        uint256 platformFee;
        uint256 timestamp;
        bytes32 mentoTxHash;
        string corridor;
    }
    
    mapping(uint256 => Remittance) public remittances;
    mapping(address => uint256[]) public userRemittances;
    
    event RemittanceLogged(
        uint256 indexed remittanceId,
        address indexed sender,
        address indexed recipient,
        string fromCurrency,
        string toCurrency,
        uint256 amountSent,
        uint256 amountReceived,
        string corridor
    );
    
    constructor() Ownable(msg.sender) {
        // Contract is ready to use immediately after deployment
    }
    
    /**
     * @dev Log a completed remittance transaction
     * @param recipient Address receiving the funds
     * @param fromToken Source token contract address
     * @param toToken Destination token contract address
     * @param fromCurrency Source currency (e.g., "cUSD")
     * @param toCurrency Destination currency (e.g., "cKES")
     * @param amountSent Amount sent by sender
     * @param amountReceived Amount received by recipient
     * @param exchangeRate Exchange rate used (scaled by 1e18)
     * @param platformFee Fee collected by platform
     * @param mentoTxHash Mento protocol transaction hash
     * @param corridor Trading corridor (e.g., "USD-KES")
     * @return remittanceId Unique ID for this remittance
     */
    function logRemittance(
        address recipient,
        address fromToken,
        address toToken,
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amountSent,
        uint256 amountReceived,
        uint256 exchangeRate,
        uint256 platformFee,
        bytes32 mentoTxHash,
        string memory corridor
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(fromToken != address(0), "Invalid from token address");
        require(toToken != address(0), "Invalid to token address");
        require(amountSent > 0, "Amount sent must be greater than 0");
        
        // Implementation details...
        
        emit RemittanceLogged(
            remittanceId,
            msg.sender,
            recipient,
            fromCurrency,
            toCurrency,
            amountSent,
            amountReceived,
            corridor
        );
        
        return remittanceId;
    }
}
```

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use proper TypeScript types
- Follow Next.js 15 conventions
- Use proper data fetching methods
- Implement proper loading states

**Example:**
```typescript
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { FXREMIT_CONTRACT, getContractAddress, Currency, getTokenAddress } from '../lib/contracts';

export function useLogRemittance() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const chainId = useChainId();
  const address = getContractAddress(chainId);
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const logRemittance = async (params: {
    recipient: string;
    fromCurrency: Currency;
    toCurrency: Currency;
    amountSent: string;
    amountReceived: string;
    exchangeRate: string;
    platformFee: string;
    mentoTxHash: string;
    corridor: string;
  }) => {
    if (!address) {
      throw new Error('Contract not configured for this chain');
    }
    
    const fromTokenAddress = getTokenAddress(chainId as SupportedChainId, params.fromCurrency);
    const toTokenAddress = getTokenAddress(chainId as SupportedChainId, params.toCurrency);

    writeContract({
      address: address as `0x${string}`,
      abi: FXREMIT_CONTRACT.abi,
      functionName: 'logRemittance',
      args: [
        params.recipient,
        fromTokenAddress,
        toTokenAddress,
        params.fromCurrency,
        params.toCurrency,
        parseEther(params.amountSent),
        parseEther(params.amountReceived),
        parseEther(params.exchangeRate, '1'),
        parseEther(params.platformFee),
        params.mentoTxHash || '',
        params.corridor,
      ],
    });
  };

  return {
    logRemittance,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
```

## Testing

### Testing Strategy

We use a **3-tier comprehensive testing approach**:

1. **Unit Tests** - Fast, isolated component tests
2. **Integration Tests** - Real blockchain interaction tests  
3. **E2E Tests** - Full browser user flow tests

### Frontend Testing

- Write unit tests for components
- Write integration tests for features
- Use React Testing Library
- Maintain minimum 80% test coverage
- Test error cases and edge cases

```bash
# Run all frontend tests
pnpm react-app:test

# Run unit tests only
pnpm react-app:test:unit

# Run component tests only
pnpm react-app:test:component

# Run integration tests only
pnpm react-app:test:integration

# Run E2E tests only
pnpm react-app:test:e2e

# Run tests with coverage
pnpm react-app:test:coverage
```

### Smart Contract Testing

- Write unit tests for all contracts
- Test all public functions
- Test edge cases and error conditions
- Use proper test fixtures
- Maintain minimum 90% test coverage

```bash
# Run smart contract tests
pnpm hardhat:test

# Run tests with coverage
pnpm hardhat:test:coverage

# Run specific test file
pnpm --filter @fx-remit/hardhat test test/FXRemit.test.ts
```

### Test Examples

**Unit Test Example:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetPicker } from '@/components/AssetPicker';

describe('AssetPicker Component', () => {
  const mockOptions = [
    {
      code: 'cUSD',
      label: 'US Dollar',
      tokenLogo: '/cUSD.svg',
      countryFlag: '/US.svg',
      balance: 100.50,
      symbol: '$'
    }
  ];

  test('renders asset picker with correct options', () => {
    render(
      <AssetPicker
        open={true}
        title="Select Currency"
        options={mockOptions}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />
    );
    
    expect(screen.getByText('Select Currency')).toBeInTheDocument();
    expect(screen.getByText('cUSD')).toBeInTheDocument();
    expect(screen.getByText('US Dollar')).toBeInTheDocument();
  });

  test('calls onSelect when option is clicked', () => {
    const mockOnSelect = jest.fn();
    render(
      <AssetPicker
        open={true}
        options={mockOptions}
        onClose={jest.fn()}
        onSelect={mockOnSelect}
      />
    );
    
    fireEvent.click(screen.getByText('cUSD'));
    
    expect(mockOnSelect).toHaveBeenCalledWith('cUSD');
  });
});
```

**Integration Test Example:**
```typescript
import { renderHook } from '@testing-library/react';
import { useLogRemittance } from '@/hooks/useContract';

describe('useLogRemittance Hook', () => {
  test('connects to FX-Remit contract', async () => {
    const { result } = renderHook(() => useLogRemittance());
    
    expect(result.current.logRemittance).toBeDefined();
    expect(typeof result.current.logRemittance).toBe('function');
    expect(result.current.isPending).toBe(false);
  });

  test('handles contract interaction', async () => {
    const { result } = renderHook(() => useLogRemittance());
    
    const mockParams = {
      recipient: '0x742d35Cc6634C0532925a3b8D4c5DcfbC0e04f',
      fromCurrency: 'cUSD' as Currency,
      toCurrency: 'cKES' as Currency,
      amountSent: '100',
      amountReceived: '13245',
      exchangeRate: '132.45',
      platformFee: '1.5',
      mentoTxHash: '0x123...',
      corridor: 'USD-KES'
    };

    // Test that the function can be called
    expect(() => result.current.logRemittance(mockParams)).not.toThrow();
  });
});
```

### Integration Tests

```bash
# Run all tests (smart contracts + frontend)
pnpm test

# Run all tests with coverage
pnpm test:coverage
```

## Documentation

### Code Documentation

- Document all public functions and classes
- Use JSDoc comments for TypeScript/JavaScript
- Use NatSpec comments for Solidity
- Keep documentation up to date
- Document complex algorithms

### Project Documentation

- Update README.md for major changes
- Document new environment variables
- Update API documentation
- Document breaking changes
- Keep setup instructions current

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   pnpm test
   pnpm hardhat:test
   ```

2. **Check code coverage**
   ```bash
   pnpm react-app:test:coverage
   pnpm hardhat:test:coverage
   ```

3. **Run linting**
   ```bash
   pnpm lint
   ```

4. **Update documentation**
   - Update README.md if needed
   - Add JSDoc comments for new functions
   - Update API documentation

### PR Template

```markdown
## Description
[Describe your changes here]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests pass locally
- [ ] Test coverage maintained/improved

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] All tests pass
- [ ] I have checked my code and corrected any misspellings
- [ ] I have tested my changes in the development environment

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Additional Notes
[Any additional information]
```

### Review Process

1. **Create Pull Request** to the appropriate target branch:
   - UI changes → `feat/ui-revamp`
   - Farcaster features → `feat/farcaster-miniapp`
   - General features → `staging`
   - Testing/experimental → `testing`
2. **Request review** from maintainers
3. **Address review comments** promptly
4. **Get approval** from at least one maintainer
5. **Merge** after approval

## Smart Contract Development

### Security Guidelines

- Follow security best practices
- Use OpenZeppelin contracts
- Implement proper access control
- Add reentrancy guards where needed
- Use safe math operations
- Implement proper upgrade patterns
- Get security audits before mainnet deployment

### Development Process

1. **Local Development**
   ```bash
   pnpm hardhat:run:node
   pnpm hardhat:compile
   pnpm hardhat:test
   ```

2. **Testnet Deployment**
   ```bash
   pnpm --filter @fx-remit/hardhat run scripts/deploy.ts --network alfajores
   ```

3. **Mainnet Deployment**
```bash
   pnpm --filter @fx-remit/hardhat run scripts/deploy.ts --network celo
   ```

### Contract Verification

```bash
# Verify on CeloScan
pnpm --filter @fx-remit/hardhat verify --network celo CONTRACT_ADDRESS
```

## Frontend Development

### Component Guidelines

- Use atomic design principles
- Implement proper error handling
- Use proper loading states
- Implement proper form validation
- Use proper state management
- Follow accessibility guidelines (WCAG 2.1)

### Performance Guidelines

- Optimize images and assets
- Implement proper caching
- Use proper code splitting
- Optimize bundle size
- Use proper lazy loading
- Monitor performance metrics

### State Management

- Use React Query for server state
- Use Context API for global state
- Use local state for component-specific state
- Avoid prop drilling

## Community Guidelines

### Communication

- Be respectful and inclusive
- Use clear, concise language
- Ask questions when unsure
- Share knowledge and help others
- Provide constructive feedback

### Issue Reporting

When reporting issues:

1. **Use the issue template**
2. **Provide clear steps to reproduce**
3. **Include error messages and logs**
4. **Add screenshots if applicable**
5. **Specify your environment**

### Feature Requests

When requesting features:

1. **Describe the problem you're solving**
2. **Explain why this feature is needed**
3. **Provide use cases**
4. **Consider implementation complexity**

## Troubleshooting

### Common Issues

1. **Build Failures**
```bash
   # Clear cache and reinstall
   rm -rf node_modules
   pnpm store prune
   pnpm install
   ```

2. **Test Failures**
```bash
   # Check test environment
   pnpm react-app:test --verbose
   ```

3. **Contract Deployment Issues**
   ```bash
   # Check network connection
   pnpm hardhat:run:node --fork https://alfajores-forno.celo-testnet.org
   ```

4. **Wallet Connection Issues**
   ```bash
   # Check WalletConnect configuration
   # Verify NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
   ```

### Getting Help

- Check existing issues
- Search documentation
- Ask in discussions
- Join our community chat
- Contact maintainers

## Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time chat and community building
- **X/Twitter**: For updates and discussions
- **Email**: For security issues (see SECURITY.md)

## Additional Resources

- [Project Documentation](docs/)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Security Guidelines](docs/SECURITY.md)
- [Setup Instructions](docs/SETUP.md)
- [FAQ](docs/FAQ.md)

## License

By contributing to FX-Remit, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to FX-Remit! Your contributions help make cross-border remittances more accessible and efficient. 
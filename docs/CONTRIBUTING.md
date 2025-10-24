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
// Good
interface RemittanceData {
  id: string;
  amount: string;
  currency: string;
  recipient: string;
}

const processRemittance = async (data: RemittanceData): Promise<void> => {
  const response = await fetch('/api/remittance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to process remittance');
  }
};

// Bad
const processRemittance = async (data: any): Promise<any> => {
  const response = await fetch('/api/remittance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  return response.json();
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
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FXRemit Contract
 * @dev Manages cross-border remittances using Mento Protocol
 * @author FX-Remit Team
 */
contract FXRemit is AccessControl, ReentrancyGuard {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    
    event RemittanceProcessed(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string currency,
        uint256 timestamp
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Process a remittance transaction
     * @param recipient Address of the recipient
     * @param amount Amount to send
     * @param currency Currency code
     */
    function processRemittance(
        address recipient,
        uint256 amount,
        string calldata currency
    ) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
    {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Process remittance logic here
        
        emit RemittanceProcessed(msg.sender, recipient, amount, currency, block.timestamp);
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
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface RemittanceFormData {
  recipient: string;
  amount: string;
  currency: string;
}

export const RemittanceForm: React.FC = () => {
  const { address } = useAccount();
  const [formData, setFormData] = useState<RemittanceFormData>({
    recipient: '',
    amount: '',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/remittance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, sender: address }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process remittance');
      }
      
      // Handle success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="recipient">Recipient Address</label>
        <input
          id="recipient"
          type="text"
          value={formData.recipient}
          onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          required
        />
      </div>
      
      <div>
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Send Remittance'}
      </button>
    </form>
  );
};
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
import { RemittanceForm } from '@/components/RemittanceForm';

describe('RemittanceForm Component', () => {
  test('renders form with correct fields', () => {
    render(<RemittanceForm />);
    
    expect(screen.getByLabelText('Recipient Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send remittance/i })).toBeInTheDocument();
  });

  test('calls onSubmit handler when form is submitted', async () => {
    const mockSubmit = jest.fn();
    render(<RemittanceForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Recipient Address'), {
      target: { value: '0x123...' }
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '100' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /send remittance/i }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      recipient: '0x123...',
      amount: '100',
      currency: 'USD'
    });
  });
});
```

**Integration Test Example:**
```typescript
import { renderHook } from '@testing-library/react';
import { useFXRemit } from '@/hooks/useFXRemit';

describe('useFXRemit Hook', () => {
  test('connects to real blockchain', async () => {
    const { result } = renderHook(() => useFXRemit({ 
      contractAddress: '0x123...', 
      rpcUrl: 'https://alfajores-forno.celo-testnet.org' 
    }));
    
    // Tests real blockchain interaction
    expect(result.current.isConnected).toBeDefined();
    expect(result.current.processRemittance).toBeDefined();
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

Thank you for contributing to FX-Remit! Your contributions help make cross-border remittances more accessible and efficient. 🌍💸 
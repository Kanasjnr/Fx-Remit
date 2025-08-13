# Contributing to FX-Remit

Thank you for your interest in contributing to FX-Remit! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Security](#security)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Git
- A Celo wallet (for testing)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/fx-remit.git
   cd fx-remit
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/Kanasjnr/fx-remit.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Create environment files for both packages:

**Frontend (.env.local in packages/react-app/)**
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_FXREMIT_CONTRACT=your_contract_address
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
```

**Smart Contracts (.env in packages/hardhat/)**
```bash
PRIVATE_KEY=your_private_key_for_deployment
CELOSCAN_API_KEY=your_celoscan_api_key
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
MAINNET_RPC_URL=https://forno.celo.org
```

### 3. Start Development Servers

```bash
# Start frontend development server
pnpm react-app:dev

# In another terminal, start local blockchain
pnpm hardhat:run:node

# Deploy contracts to local network
pnpm hardhat:compile
pnpm --filter @fx-remit/hardhat run scripts/deploy.ts --network localhost
```

## Testing

### Smart Contract Tests

```bash
# Run all smart contract tests
pnpm hardhat:test

# Run tests with coverage
pnpm hardhat:test:coverage

# Run tests with gas reporting
pnpm --filter @fx-remit/hardhat test --gas-report
```

### Frontend Tests

```bash
# Run unit and component tests
pnpm react-app:test

# Run tests in watch mode
pnpm react-app:test:watch

# Run tests with coverage
pnpm react-app:test:coverage

# Run end-to-end tests
pnpm react-app:test:e2e
```

### Integration Tests

```bash
# Run all tests (smart contracts + frontend)
pnpm test

# Run all tests with coverage
pnpm test:coverage
```

## Code Style

### Smart Contracts (Solidity)

- Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/v0.8.24/style-guide.html)
- Use NatSpec documentation for all public functions
- Maximum line length: 120 characters
- Use 4 spaces for indentation
- Use camelCase for variables and functions
- Use PascalCase for contracts and structs

Example:
```solidity
/**
 * @title Example Contract
 * @dev Example contract demonstrating code style
 */
contract ExampleContract {
    uint256 public exampleVariable;
    
    /**
     * @dev Example function with NatSpec
     * @param value The value to set
     */
    function setValue(uint256 value) external {
        exampleVariable = value;
    }
}
```

### Frontend (TypeScript/React)

- Follow [TypeScript](https://www.typescriptlang.org/docs/) best practices
- Use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) configurations
- Use functional components with hooks
- Use TypeScript interfaces for props and state
- Maximum line length: 100 characters
- Use 2 spaces for indentation

Example:
```typescript
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const ExampleComponent: React.FC<ComponentProps> = ({
  title,
  onAction,
}) => {
  return (
    <div className="example-component">
      <h1>{title}</h1>
      <button onClick={onAction}>Action</button>
    </div>
  );
};
```

### Git Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(contracts): add new remittance logging function
fix(frontend): resolve wallet connection issue
docs(readme): update installation instructions
test(contracts): add comprehensive test coverage
```

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clear, readable code
- Add tests for new functionality
- Update documentation as needed
- Follow the code style guidelines

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Check code style
pnpm lint

# Build the project
pnpm build
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): description of changes"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- **Title**: Clear description of the change
- **Description**: 
  - What does this PR do?
  - Why is this change needed?
  - How was it tested?
  - Any breaking changes?
  - Screenshots (if UI changes)

### 6. PR Review Process

- All PRs require at least one review
- CI/CD checks must pass
- Code coverage should not decrease
- Security scans must pass

## Reporting Bugs

### Before Reporting

1. Check if the bug has already been reported
2. Try to reproduce the bug with the latest version
3. Check the documentation and FAQ

### Bug Report Template

```markdown
**Bug Description**
Clear and concise description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]
- Node.js version: [e.g. 18.17.0]
- pnpm version: [e.g. 8.6.0]

**Additional Context**
Any other context about the problem.
```

## Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear and concise description of the feature.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternative Solutions**
Any alternative solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

## Security

### Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Email security@fx-remit.com (if available) or contact the maintainers privately
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

### Security Best Practices

- Never commit private keys or sensitive data
- Use environment variables for configuration
- Follow secure coding practices
- Keep dependencies updated
- Run security scans regularly

## Getting Help

- **Documentation**: Check the [docs/](./) directory
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community (if available)

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes

Thank you for contributing to FX-Remit! 🚀 
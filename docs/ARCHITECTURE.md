# Project Architecture

fx-remit is organized as a monorepo with the following main packages:

- **packages/react-app/**: The frontend React application (Next.js, TypeScript, Tailwind CSS).
- **packages/hardhat/**: The smart contract and blockchain backend (Solidity, Hardhat).

## Directory Structure

- `packages/react-app/ABI/` – Contract ABIs for frontend use
- `packages/react-app/app/` – Next.js app pages
- `packages/react-app/components/` – Reusable React components
- `packages/react-app/hooks/` – Custom React hooks
- `packages/react-app/lib/` – Frontend utility libraries
- `packages/react-app/providers/` – React context providers
- `packages/react-app/styles/` – Global styles (Tailwind)
- `packages/hardhat/contracts/` – Solidity smart contracts
- `packages/hardhat/scripts/` – Deployment and utility scripts
- `packages/hardhat/test/` – Smart contract tests

## Technologies Used
- React, Next.js, TypeScript, Tailwind CSS
- Solidity, Hardhat
- pnpm (monorepo management)

See [SETUP.md](./SETUP.md) for installation instructions. 
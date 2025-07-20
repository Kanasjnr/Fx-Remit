# Setup & Installation

Follow these steps to set up fx-remit on your local machine.

## Prerequisites
- Node.js (v16+ recommended)
- pnpm (preferred) or npm/yarn
- Git

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/fx-remit.git
   cd fx-remit
   ```
2. **Install dependencies:**
   ```sh
   pnpm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in required values (if applicable).

4. **Run the development server:**
   - For the React app:
     ```sh
     cd packages/react-app
     pnpm dev
     ```
   - For Hardhat (blockchain):
     ```sh
     cd packages/hardhat
     pnpm hardhat node
     ```

## Additional Resources
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure.
- For troubleshooting, check [FAQ.md](./FAQ.md). 
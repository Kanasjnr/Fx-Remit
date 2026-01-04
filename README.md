<!-- TITLE -->
<p align="center">
  <h2 align="center">FX-Remit</h2>
  <p align="center">Cross-border remittances made simple with blockchain technology</p>
</p>

---

## **Table of Contents**

- [**About FX-Remit**](#about-fx-remit)
- [**Key Features**](#key-features)
- [**Supported Currencies**](#supported-currencies)
- [**Architecture**](#architecture)
- [**Built With**](#built-with)
- [**Prerequisites**](#prerequisites)
- [**Quick Start**](#quick-start)
- [**Installation**](#installation)
- [**Configuration**](#configuration)
- [**Smart Contract Deployment**](#smart-contract-deployment)
- [**Frontend Development**](#frontend-development)
- [**Environment Variables**](#environment-variables)
- [**Usage Guide**](#usage-guide)
- [**API Reference**](#api-reference)
- [**Testing**](#testing)
- [**Deployment**](#deployment)
- [**Monitoring & Analytics**](#monitoring--analytics)
- [**Security**](#security)
- [**Contributing**](#contributing)
- [**License**](#license)
- [**Support**](#support)

---

## **About FX-Remit**

FX-Remit is a **next-generation cross-border remittance platform** built on the Celo blockchain that enables users to send money globally with unprecedented speed, security, and low fees. By leveraging the **Mento Protocol**, FX-Remit provides seamless currency exchanges between 15 different supported currencies pluss USDT,USDC and the CELO token, making international money transfers accessible to everyone.
 

### **Mission**
To democratize cross-border payments by providing a fast, secure, and affordable alternative to traditional remittance services, powered by blockchain technology.

### **Vision**
A world where sending money across borders is as easy as sending a text message, with transparent fees and instant settlements.

---

## **Key Features**

### **Multi-Currency Support**
- **18 supported currencies** including USD, EUR, KES, NGN, GHS, USDT, USDC, CELO, and more
- **Real-time exchange rates** powered by Mento Protocol
- **Automatic currency conversion** with competitive rates

### **Farcaster Mini App Integration**
- **Native Farcaster support** - Works seamlessly in Warpcast
- **Username resolution** - Send to @username instead of addresses
- **Batch transactions** - Approve + swap in one signature (EIP-5792)
- **Auto-connect** - No manual wallet connection needed
- **Share on Farcaster** - Built-in social sharing

### **Lightning Fast Transfers**
- **Instant transactions** on the Celo blockchain
- **Sub-second confirmation times** with Celo's 5-second block time
- **24/7 availability** - no banking hours limitations
- **Smart status tracking** - Progressive feedback on transaction status

### **Ultra-Low Fees**
- **1.5% platform fee** - significantly lower than traditional services
- **No hidden charges** - transparent fee structure
- **Gas fees under $0.01** thanks to Celo's efficient network

### **Enterprise-Grade Security**
- **V2 contract with Permit2** - Gas-efficient token approvals
- **Audited smart contracts** with multiple security layers
- **Non-custodial** - you control your funds
- **Pausable contracts** for emergency situations
- **Reentrancy protection** and comprehensive validation

### **Advanced Analytics**
- **Real-time transaction tracking**
- **Historical transaction data**
- **Corridor volume analytics**
- **Platform-wide statistics**
- **Divvi referral tracking** - Earn rewards for referrals

### **Modern User Experience**
- **Responsive web interface** works on all devices
- **Multiple platforms** - Web, Farcaster Mini App, MiniPay
- **Wallet integration** with popular crypto wallets
- **Real-time balance updates**
- **Transaction history** with detailed records
- **Progressive UX** - Clear status updates and smart timeout handling

---


## **Supported Currencies**

FX-Remit supports **18 currencies** across major economic regions:

### **Major Global Currencies**
| Currency | Symbol | Full Name |
|----------|---------|-----------|
| cUSD | $ | US Dollar |
| cEUR | € | Euro |
| cGBP | £ | British Pound |
| cCAD | C$ | Canadian Dollar |
| cAUD | A$ | Australian Dollar |
| cCHF | CHF | Swiss Franc |
| cJPY | ¥ | Japanese Yen |

### **Emerging Markets**
| Currency | Symbol | Full Name |
|----------|---------|-----------|
| cREAL | R$ | Brazilian Real |
| cCOP | COP$ | Colombian Peso |
| cKES | KSh | Kenyan Shilling |
| cNGN | ₦ | Nigerian Naira |
| cZAR | R | South African Rand |
| cGHS | ₵ | Ghanaian Cedi |
| eXOF | XOF | CFA Franc |
| PUSO | ₱ | Philippine Peso |

### **Stablecoins & Native Token**
| Currency | Symbol | Full Name |
|----------|---------|-----------|
| USDT | USD₮ | Tether USD |
| USDC | USDC | USD Coin |
| CELO | CELO | Celo Native Token |

### **Popular Corridors**
- **USD ↔ KES** - US to Kenya
- **EUR ↔ NGN** - Europe to Nigeria  
- **GBP ↔ GHS** - UK to Ghana
- **USD ↔ REAL** - US to Brazil
- **And many more combinations!**

---

## **Architecture**

FX-Remit follows a **modern decentralized architecture** with clear separation of concerns:

### **System Overview**

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Farcaster Mini  │    │   Web Frontend   │    │    MiniPay       │
│      App         │    │    (Next.js)     │    │                  │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  FXRemitV2 Contract     │
                    │                         │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Mento Protocol  │    │  Neynar API     │    │ Divvi Referrals │
│   (DEX/AMM)     │    │  (@username)    │    │   (Rewards)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Core Components**

#### **1. Smart Contract Layer (`FXRemitV2.sol`)**
- **Permit2 Integration**: Gas-efficient token approvals
- **Batch Transactions**: Single signature for approve + swap (EIP-5792)
- **Transaction Logging**: Records all remittance transactions
- **Analytics Engine**: Tracks volume, fees, and corridor statistics  
- **Security Framework**: Reentrancy protection, pausable, access control
- **User Management**: Individual transaction history and statistics

#### **2. Frontend Application (`Next.js`)**
- **Multi-Platform**: Web, Farcaster Mini App, MiniPay support
- **User Interface**: Modern, responsive React application
- **Wallet Integration**: Seamless connection with crypto wallets
- **Real-time Updates**: Live balance and transaction status
- **State Management**: Efficient data flow with React Query
- **Progressive UX**: Smart timeout handling and status updates

#### **3. Farcaster Mini App**
- **Native Integration**: Runs inside Warpcast app
- **Auto-Connect**: Automatic wallet connection
- **Username Resolution**: Send to @username via Neynar API
- **Social Features**: Share transactions on Farcaster
- **Optimized UX**: Tailored for mobile experience

#### **4. Blockchain Integration**
- **Celo Network**: Fast, low-cost transactions
- **Mento Protocol**: Decentralized exchange for currency swaps
- **Permit2**: Efficient token approval system
- **Web3 Infrastructure**: Wagmi, Viem, RainbowKit integration
- **Divvi Protocol**: Referral reward system

---

## **Built With**

### **Blockchain & Smart Contracts**
- **[Celo](https://celo.org/)** - Mobile-first blockchain platform
- **[Solidity](https://docs.soliditylang.org/)** - Smart contract programming language
- **[Hardhat](https://hardhat.org/)** - Development environment
- **[OpenZeppelin](https://openzeppelin.com/)** - Security-focused contract libraries
- **[Mento Protocol](https://mento.org/)** - Decentralized exchange protocol

### **Frontend Technologies**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://reactjs.org/)** - Modern UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Headless UI](https://headlessui.com/)** - Accessible UI components

### **Web3 Integration**
- **[Wagmi](https://wagmi.sh/)** - React hooks for Ethereum
- **[Viem](https://viem.sh/)** - TypeScript interface for Ethereum
- **[RainbowKit](https://www.rainbowkit.com/)** - Wallet connection library
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Farcaster Mini App SDK](https://docs.farcaster.xyz/developers/frames/v2/spec)** - Farcaster integration
- **[Divvi Referral SDK](https://www.divvi.xyz/)** - Referral reward system
- **[Permit2](https://github.com/Uniswap/permit2)** - Efficient token approvals
- **[Neynar API](https://neynar.com/)** - Farcaster username resolution

### **Development Tools**
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline

---

## **Prerequisites**

Before getting started with FX-Remit, ensure you have the following installed:

### **System Requirements**
- **Node.js** v20.0.0 or higher
- **Git** v2.38.0 or higher
- **pnpm** v8.0.0 or higher (recommended) or **npm**/**yarn**

### **Development Tools**
- **Code Editor**: VS Code, Cursor, or your preferred IDE
- **Browser**: Chrome, Firefox, or any modern browser
- **Terminal**: Any terminal application

### **Blockchain Requirements**
- **Celo Wallet** (Valora, MetaMask, or any Celo-compatible wallet)
- **Test Funds**: Get CELO tokens from [Celo Faucet](https://faucet.celo.org/alfajores)
- **API Keys**: WalletConnect Project ID, Celoscan API key (optional)

### **Knowledge Prerequisites**
- Basic understanding of **React** and **TypeScript**
- Familiarity with **blockchain concepts** and **smart contracts**
- Understanding of **DeFi** and **decentralized exchanges**

---

## **Quick Start**

Get FX-Remit running locally in under 5 minutes:

### **One-Line Setup**
```bash
git clone https://github.com/your-username/fx-remit.git && cd fx-remit && pnpm install && pnpm run react-app:dev
```

### **Step-by-Step Setup**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fx-remit.git
   cd fx-remit
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp packages/react-app/.env.example packages/react-app/.env
   cp packages/hardhat/.env.example packages/hardhat/.env
   ```

4. **Start the development server**
   ```bash
   pnpm run react-app:dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

**Congratulations!** FX-Remit is now running locally!

---

## **Installation**

### **Installation Options**

#### **Option 1: Using pnpm (Recommended)**
```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Clone and install
git clone https://github.com/your-username/fx-remit.git
cd fx-remit
pnpm install
```

#### **Option 2: Using npm**
```bash
git clone https://github.com/your-username/fx-remit.git
cd fx-remit
npm install
```

#### **Option 3: Using yarn**
```bash
git clone https://github.com/your-username/fx-remit.git
cd fx-remit
yarn install
```

### **Project Structure**
```
fx-remit/
├── packages/
│   ├── hardhat/                 # Smart contract development
│   │   ├── contracts/
│   │   │   ├── FXRemit.sol     # Main remittance contract
│   │   │   └── constants/
│   │   │       └── MentoTokens.sol # Supported token addresses
│   │   ├── scripts/
│   │   │   └── deploy.ts       # Deployment scripts
│   │   ├── test/               # Contract tests
│   │   └── hardhat.config.ts   # Hardhat configuration
│   └── react-app/              # Frontend application
│       ├── app/                # Next.js app directory
│       │   ├── page.tsx        # Landing page
│       │   ├── send/           # Send money page
│       │   ├── history/        # Transaction history
│       │   └── profile/        # User profile
│       ├── components/         # React components
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Utility functions
│       └── providers/          # React context providers
├── package.json                # Root package configuration
└── README.md                   # This file
```

---

## **Configuration**

### **Environment Variables**

FX-Remit uses environment variables for configuration. You'll need to set up variables for both the frontend and smart contract development.

#### **Frontend Configuration (`packages/react-app/.env`)**
```env
# WalletConnect Configuration
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id

# Smart Contract Addresses - V2
NEXT_PUBLIC_FXREMIT_V2_CONTRACT_ALFAJORES=0x...
NEXT_PUBLIC_FXREMIT_V2_CONTRACT_MAINNET=0xD8726F627b5A14c17Cb848EE3c564283CBA8e057

# Farcaster Integration
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key

# Divvi Referral System
NEXT_PUBLIC_DIVVI_CONSUMER_ADDRESS=your_divvi_address

# Mento Token Addresses - Alfajores Testnet
NEXT_PUBLIC_CUSD_ALFAJORES=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
NEXT_PUBLIC_CEUR_ALFAJORES=0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F
NEXT_PUBLIC_CKES_ALFAJORES=0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92
# ... (more token addresses)

# Mento Token Addresses - Mainnet
NEXT_PUBLIC_CUSD_MAINNET=0x...
NEXT_PUBLIC_CEUR_MAINNET=0x...
# ... (more token addresses)
```

#### **Smart Contract Configuration (`packages/hardhat/.env`)**
```env
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here

# Network URLs (optional - defaults provided)
CELO_MAINNET_URL=https://forno.celo.org
CELO_ALFAJORES_URL=https://alfajores-forno.celo-testnet.org
```

### **Configuration Guide**

#### **1. WalletConnect Setup**
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to your `.env` file

#### **2. Private Key Setup**
**Security Warning**: Never use your main wallet's private key for development!

1. Create a new wallet for development
2. Export the private key
3. Add test funds from [Celo Faucet](https://faucet.celo.org/alfajores)
4. Add the private key to your `.env` file

#### **3. Celoscan API Key (Optional)**
1. Visit [Celoscan](https://celoscan.io/myapikey)
2. Create an account and generate an API key
3. Add it to your `.env` file for contract verification

#### **4. Neynar API Key (For Farcaster)**
1. Visit [Neynar](https://neynar.com/)
2. Create an account and generate an API key
3. Add it to your `.env` file to enable @username resolution

#### **5. Divvi Setup (Optional - For Referrals)**
1. Register at [Divvi](https://www.divvi.xyz/)
2. Get your consumer address
3. Add it to your `.env` file to enable referral tracking

---

## **Smart Contract Deployment**

### **Deployed Contracts**

#### **Celo Mainnet**
- **FXRemit V2 Contract**: [`0xD8726F627b5A14c17Cb848EE3c564283CBA8e057`](https://celoscan.io/address/0xD8726F627b5A14c17Cb848EE3c564283CBA8e057)
- **Network**: Celo Mainnet
- **Status**: ✅ Verified and Active
- **Features**: Permit2 integration, batch transactions, referral tracking

#### **Legacy Contract**
- **FXRemit V1**: [`0x1245211aBAe5013e7f5523013b78F50AB44C2c57`](https://celoscan.io/address/0x1245211aBAe5013e7f5523013b78F50AB44C2c57)
- **Status**: ⚠️ Deprecated - Migrate to V2

### **Deployment Process**

#### **1. Compile Contracts**
```bash
cd packages/hardhat
pnpm run compile
```

#### **2. Deploy to Alfajores Testnet**
```bash
pnpm run deploy --network alfajores
```

#### **3. Deploy to Celo Mainnet**
```bash
pnpm run deploy --network celo
```

#### **4. Verify Contract**
```bash
npx hardhat verify CONTRACT_ADDRESS --network alfajores
```

### **Deployment Checklist**

- [ ] **Environment variables configured**
- [ ] **Private key has sufficient CELO for gas**
- [ ] **Contracts compiled successfully**
- [ ] **Tests passing**
- [ ] **Network connection stable**
- [ ] **Contract verified on Celoscan**

### **Custom Deployment Scripts**

The deployment script (`packages/hardhat/scripts/deploy.ts`) includes:
- **Automated deployment** of FXRemit contract
- **Token validation** testing
- **Contract verification** on Celoscan
- **Deployment logging** with addresses and network info

### **Contract Functions**

#### **Core Functions (V2)**
- `swapAndSend(...)` - Single-hop swap + send with Permit2
- `swapAndSendPath(...)` - Two-hop swap (via intermediate) with Permit2
- `getRemittance()` - Get details of a specific remittance
- `getUserRemittances()` - Get all user's remittances
- `getPlatformStats()` - Get platform-wide statistics

#### **Admin Functions**
- `setBroker(address)` - Set Mento Broker address
- `setProviderAllowed(address,bool)` - Allowlist Mento provider (BiPoolManager)
- `setFeeBps(uint16)` - Set platform fee bps (max 10%)
- `pause()` / `unpause()` - Emergency controls
- `withdrawFees()` - Withdraw platform fees
- `owner()` - Check contract owner

#### **View Functions**
- `getCorridorVolume()` - Volume for specific corridor
- `isSupportedToken()` - Check if token is supported
- `getTokenSymbol()` - Get token symbol from address

---

## **Frontend Development**

### **Development Server**

#### **Start Development Server**
```bash
pnpm run react-app:dev
```

#### **Build for Production**
```bash
pnpm run react-app:build
```

#### **Start Production Server**
```bash
pnpm run react-app:start
```

### **Application Features**

#### **Landing Page (`/`)**
- Hero section with platform overview
- Key features highlighting
- Platform statistics display
- Getting started call-to-action

#### **Send Money (`/send`)**
- Currency selection (from/to)
- Amount input with balance display
- Real-time exchange rate quotes
- Recipient address or @username input
- Auto-resolve Farcaster usernames
- Transaction execution with batch support
- Progressive status updates
- Success/error feedback with share option

#### **Transaction History (`/history`)**
- User's transaction history
- Detailed transaction information
- Filter and search capabilities
- Export functionality

#### **Profile (`/profile`)**
- User statistics
- Transaction summaries
- Platform analytics
- Account settings

### **Custom Hooks**

#### **Contract Hooks (`hooks/useContract.ts`)**
- `useFXRemitContract()` - Contract instance
- `useLogRemittance()` - Log remittance transaction
- `useUserRemittances()` - Get user's remittances
- `usePlatformStats()` - Platform statistics

#### **Swap Hooks**
- `useEthersSwap()` - Web wallet swap (standard)
- `useFarcasterSwap()` - Farcaster Mini App swap (batch)
- `useQuote()` - Get exchange rate quote
- `useTokenBalance()` - Get token balance

#### **Farcaster Hooks (`hooks/useFarcasterX.ts`)**
- `useFarcasterMiniApp()` - Detect Mini App environment
- `useFarcasterResolver()` - Resolve @username to address
- `useFarcasterSwap()` - Execute batch swap in Mini App

#### **Mento Hooks (`hooks/useMento.ts`)**
- `useTokenBalance()` - Get token balance
- `useQuote()` - Get exchange rate quote
- `useExchangeRate()` - Real-time exchange rates

### **UI Components**

#### **Navigation**
- `Header.tsx` - Main navigation bar
- `BottomNavigation.tsx` - Mobile navigation
- `Layout.tsx` - App layout wrapper

#### **Features**
- `ConnectButton` - Wallet connection
- `CurrencySelector` - Currency selection
- `ExchangeRate` - Rate display
- `TransactionCard` - Transaction display

---

## **Environment Variables**

### **Complete Environment Variables Reference**

#### **Frontend Variables**
```env
# Required
NEXT_PUBLIC_WC_PROJECT_ID=                    # WalletConnect Project ID

# Contract Addresses - V2
NEXT_PUBLIC_FXREMIT_V2_CONTRACT_ALFAJORES=    # FXRemit V2 contract on Alfajores
NEXT_PUBLIC_FXREMIT_V2_CONTRACT_MAINNET=0xD8726F627b5A14c17Cb848EE3c564283CBA8e057

# Farcaster Integration
NEXT_PUBLIC_NEYNAR_API_KEY=                   # Neynar API for @username resolution

# Divvi Referral System (Optional)
NEXT_PUBLIC_DIVVI_CONSUMER_ADDRESS=           # Your Divvi consumer address

# Alfajores Testnet Token Addresses
NEXT_PUBLIC_CUSD_ALFAJORES=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
NEXT_PUBLIC_CEUR_ALFAJORES=0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F
NEXT_PUBLIC_CGBP_ALFAJORES=0x47f2Fb88105155a18c390641C8a73f1402B2BB12
NEXT_PUBLIC_CCAD_ALFAJORES=0x02EC9E0D2Fd73e89168C1709e542a48f58d7B133
NEXT_PUBLIC_CAUD_ALFAJORES=0x84CBD49F5aE07632B6B88094E81Cce8236125Fe0
NEXT_PUBLIC_CCHF_ALFAJORES=0xADC57C2C34aD021Df4421230a6532F4e2E1dCE4F
NEXT_PUBLIC_CJPY_ALFAJORES=0x2E51F41238cA36a421C9B8b3e189e8Cc7653FE67
NEXT_PUBLIC_CREAL_ALFAJORES=0xE4D517785D091D3c54818832dB6094bcc2744545
NEXT_PUBLIC_CCOP_ALFAJORES=0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4
NEXT_PUBLIC_CKES_ALFAJORES=0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92
NEXT_PUBLIC_CNGN_ALFAJORES=0x4a5b03B8b16122D330306c65e4CA4BC5Dd6511d0
NEXT_PUBLIC_CZAR_ALFAJORES=0x1e5b44015Ff90610b54000DAad31C89b3284df4d
NEXT_PUBLIC_CGHS_ALFAJORES=0x295B66bE7714458Af45E6A6Ea142A5358A6cA375
NEXT_PUBLIC_EXOF_ALFAJORES=0xB0FA15e002516d0301884059c0aaC0F0C72b019D
NEXT_PUBLIC_PUSO_ALFAJORES=0x5E0E3c9419C42a1B04e2525991FB1A2C467AB8bF

# Mainnet Token Addresses (add your mainnet addresses)
NEXT_PUBLIC_CUSD_MAINNET=
NEXT_PUBLIC_CEUR_MAINNET=
# ... (continue for all tokens)
```

#### **Smart Contract Variables**
```env
# Required
PRIVATE_KEY=                                  # Private key for deployment
CELOSCAN_API_KEY=                            # Celoscan API key for verification

# Optional - Network URLs
CELO_MAINNET_URL=https://forno.celo.org
CELO_ALFAJORES_URL=https://alfajores-forno.celo-testnet.org
```

### **Security Best Practices**

1. **Never commit `.env` files** to version control
2. **Use different private keys** for development and production
3. **Rotate API keys** regularly
4. **Use environment-specific configurations**
5. **Implement proper access controls**

---

## **Usage Guide**

### **Sending Money**

#### **Step 1: Connect Wallet**
1. Click "Connect Wallet" button
2. Select your preferred wallet (MetaMask, Valora, etc.)
3. Approve the connection request
4. Ensure you're connected to Celo network

#### **Step 2: Select Currencies**
1. Choose **source currency** (what you're sending)
2. Choose **destination currency** (what recipient gets)
3. View real-time exchange rate
4. Check available balance

#### **Step 3: Enter Details**
```
Amount: 100.00 cUSD
Recipient: @username or 0x742d35Cc6634C0532925a3b8D4c5DcfbC0e04f
Exchange Rate: 1 cUSD = 132.45 cKES
You Send: 100.00 cUSD
Recipient Gets: 132.45 cKES
Platform Fee: 1.99 cKES (1.5%)
```

**Using Farcaster Usernames:**
- Type `@username` in the recipient field
- Press Enter or click away to auto-resolve
- The address will be fetched automatically
- Works with any Farcaster user who has a verified wallet

#### **Step 4: Execute Transaction**
1. Review transaction details
2. Click "Send Money"
3. **In Farcaster Mini App**: Single signature for approve + swap
4. **On Web**: May need two signatures (approve, then swap)
5. Wait for transaction confirmation (typically 15-30 seconds)
6. If status unclear after 60s, verify on Celoscan before retrying
7. Share transaction on Farcaster (if using Mini App)

**Progressive Status Updates:**
- 0-30s: "Processing your transfer..."
- 30-60s: "This is taking longer than usual. The network might be busy..."
- 60s+: "Status unclear - Check Celoscan before retrying"

### **Viewing Transaction History**

#### **Transaction Details**
Each transaction includes:
- **Transaction ID** and timestamp
- **Amount sent** and **amount received**
- **Exchange rate** at time of transaction
- **Platform fee** charged
- **Recipient address**
- **Transaction hash** for verification
- **Status** (pending, completed, failed)

#### **Filtering Options**
- **Date range** filtering
- **Currency pair** filtering
- **Status** filtering
- **Amount range** filtering

### **Platform Analytics**

#### **User Statistics**
- Total amount sent
- Number of transactions
- Fees paid
- Favorite corridors

#### **Platform Statistics**
- Total platform volume
- Total transactions processed
- Most popular corridors
- Platform fees collected

---

## **Using FX-Remit in Farcaster**

### **Accessing the Mini App**
1. Open Warpcast app on your mobile device
2. Navigate to the FX-Remit Mini App
3. Wallet automatically connects
4. Start sending money instantly!

### **Farcaster-Specific Features**

#### **1. Full Currency Support**
All 18 currencies available on web are supported in the Mini App:
- **Major Currencies**: cUSD, cEUR, cGBP, cCAD, cAUD, cCHF, cJPY
- **Emerging Markets**: cREAL, cCOP, cKES, cNGN, cZAR, cGHS, eXOF, PUSO
- **Stablecoins**: USDT, USDC
- **Native Token**: CELO
- **All Trading Pairs**: Any currency can be sent to any other currency
- **Real-time Rates**: Same exchange rates as web version

Send USD to Kenya, EUR to Nigeria, USDT to Ghana - all from within Warpcast!

#### **2. Username Resolution**
Send money to any Farcaster user by their @username:
```
Recipient: @vitalik  → Auto-resolves to wallet address
Recipient: @dwr      → Auto-resolves to wallet address
```

#### **3. Batch Transactions (EIP-5792)**
Single signature approves and executes the swap:
- **Traditional**: Sign approve → Wait → Sign swap → Wait
- **Farcaster Mini App**: Sign once → Done! ✅

Benefits:
- **Faster**: One signature instead of two
- **Better UX**: Less friction for users
- **Gas efficient**: Optimized for Celo network

#### **4. Share on Farcaster**
After successful transfer:
1. Click "Share on Farcaster"
2. Auto-generates cast with transfer details
3. Share with your followers
4. Increase platform visibility

#### **5. Progressive Status Updates**
Real-time feedback during transaction:
- **0-30s**: Normal processing message
- **30-60s**: "Taking longer than usual" message
- **60s+**: Link to verify on Celoscan

### **Troubleshooting**

#### **"Status Unclear" Message**
If you see this after 60 seconds:
1. **Don't retry immediately!**
2. Click "Check on Celoscan"
3. Verify if transaction succeeded
4. If succeeded: Don't send again (duplicate transfer)
5. If failed: Safe to retry

#### **Username Not Found**
If @username doesn't resolve:
- Check spelling is correct
- Ensure user has verified wallet on Farcaster
- Try using wallet address instead (0x...)

#### **Transaction Taking Long**
Network might be congested:
- Wait for "taking longer" message (after 30s)
- Don't close the app
- Transaction will complete or timeout after 60s
- Check Celoscan if timeout occurs

---

## **Testing**

### **Smart Contract Testing**

#### **Run Tests**
```bash
cd packages/hardhat
pnpm run test
```

#### **Test Coverage**
```bash
pnpm run test:coverage
```

#### **Test Categories**
- **Unit Tests**: Individual function testing
- **Integration Tests**: Contract interaction testing
- **Security Tests**: Vulnerability testing
- **Gas Tests**: Gas optimization testing

### **Frontend Testing**

#### **Run Frontend Tests**
```bash
cd packages/react-app
pnpm run test
```

#### **Test Types**
- **Component Tests**: UI component testing
- **Hook Tests**: Custom hook testing
- **Integration Tests**: User flow testing
- **E2E Tests**: End-to-end testing

### **Continuous Integration**

GitHub Actions workflow includes:
- **Automated testing** on every PR
- **Code quality** checks
- **Security scanning**
- **Build verification**
- **Deployment** to staging

---

## **Deployment**

### **Frontend Deployment**

#### **Deploy to Vercel**
1. **Connect GitHub repository** to Vercel
2. **Configure environment variables**
3. **Deploy with one click**

```bash

pnpm run react-app:build
npx vercel --prod
```

#### **Deploy to Netlify**
```bash
pnpm run react-app:build
npx netlify deploy --prod --dir=packages/react-app/dist
```

### **Smart Contract Deployment**

#### **Alfajores Testnet**
```bash
cd packages/hardhat
pnpm run deploy --network alfajores
```

#### **Celo Mainnet**
```bash
cd packages/hardhat
pnpm run deploy --network celo
```

### **Production Checklist**

- [ ] **Environment variables configured**
- [ ] **Smart contracts audited**
- [ ] **Frontend security review**
- [ ] **Performance optimization**
- [ ] **Monitoring setup**
- [ ] **Backup procedures**
- [ ] **Documentation updated**

---

## **Monitoring & Analytics**

### **Platform Metrics**

#### **Transaction Metrics**
- **Total Volume**: All-time transaction volume
- **Transaction Count**: Number of transactions
- **Average Transaction Size**: Mean transaction amount
- **Popular Corridors**: Most used currency pairs

#### **User Metrics**
- **Active Users**: Daily/Monthly active users
- **User Retention**: User return rate
- **Geographic Distribution**: User location data
- **Transaction Patterns**: User behavior analysis

#### **Financial Metrics**
- **Platform Revenue**: Total fees collected
- **Revenue by Corridor**: Revenue breakdown
- **Average Fee**: Mean platform fee
- **Profit Margins**: Platform profitability

### **Real-time Monitoring**

#### **System Health**
- **Network Status**: Celo network health
- **Contract Status**: Smart contract availability
- **Frontend Status**: Application availability
- **Performance Metrics**: Response times

#### **Alerts & Notifications**
- **High Volume Alerts**: Unusual transaction volumes
- **Error Rate Alerts**: Increased error rates
- **Security Alerts**: Potential security issues
- **Performance Alerts**: System performance degradation

---



### **Frontend Security**

#### **Security Measures**
- **Input Sanitization**: All user inputs sanitized
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery protection
- **Secure Headers**: Security headers implemented
- **Content Security Policy**: CSP configured

#### **Wallet Security**
- **Private Key Protection**: Never expose private keys
- **Secure Storage**: Wallet connection state management
- **Transaction Verification**: Double-check transaction details
- **Phishing Protection**: Domain verification

### **Security Best Practices**

1. **Regular Security Audits**
2. **Dependency Updates**
3. **Environment Isolation**
4. **Access Control**
5. **Monitoring & Alerting**
6. **Incident Response Plan**

---

## **Contributing**

We welcome contributions from the community! For detailed guidelines on how to contribute to FX-Remit, please see our comprehensive [Contributing Guide](docs/CONTRIBUTING.md).

### **Quick Start for Contributors**

1. **Fork the repository** and clone your fork
2. **Read the [Contributing Guide](docs/CONTRIBUTING.md)** for detailed instructions
3. **Set up your development environment** following the guide
4. **Create a feature branch** and make your changes
5. **Submit a pull request** with proper documentation

### **Ways to Contribute**

- **Bug Reports**: Use our issue templates for detailed bug reports
- **Feature Requests**: Suggest new features with clear use cases
- **Code Contributions**: Follow our coding standards and testing requirements
- **Documentation**: Help improve our guides and API documentation
- **Testing**: Help test new features and report issues

### **Development Process**

For detailed information about our development workflow, coding standards, testing requirements, and pull request process, please refer to the [Contributing Guide](docs/CONTRIBUTING.md).

---

## **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **License Summary**

```
MIT License

Copyright (c) 2025 FX-Remit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## **Support**

### **Getting Help**

#### **Documentation**
- **README**: This comprehensive guide
- **API Reference**: Smart contract and React hooks
- **Wiki**: Additional guides and tutorials
- **FAQ**: Common questions and answers



#### **Useful Links**
- **[Celo Documentation](https://docs.celo.org/)** - Celo blockchain docs
- **[Mento Protocol](https://mento.org/)** - Mento protocol docs
- **[Next.js Documentation](https://nextjs.org/docs)** - Next.js framework docs
- **[Hardhat Documentation](https://hardhat.org/docs)** - Smart contract development

### **Contact Information**

#### **Team**
- **Lead Developer**: [@kanas](https://github.com/kanas)
- **Email**: nasihudeen04@gmail.com
- **Twitter**: [@FXRemit](https://twitter.com/FXRemit)

#### **Bug Reports**
- **GitHub Issues**: [Report a bug](https://github.com/your-username/fx-remit/issues/new?template=bug_report.md)
- **Email**: team@fx-remit.xyz

#### **Feature Requests**
- **GitHub Issues**: [Request a feature](https://github.com/your-username/fx-remit/issues/new?template=feature_request.md)
- **Email**: team@fx-remit.xyz

---

<p align="center">
  <b>Making cross-border payments accessible to everyone</b>
</p>

<p align="center">
  Built on the Celo blockchain
</p>

<p align="right">(<a href="#top">Back to top</a>)</p>

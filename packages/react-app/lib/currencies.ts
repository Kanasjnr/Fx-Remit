import type { Currency } from './contracts';

export interface CurrencyOption {
    code: Currency;
    name: string;
    symbol: string;
    tokenLogo: string;
    countryFlag: string;
}

export const CURRENCIES: CurrencyOption[] = [
    {
        code: 'cUSD',
        name: 'US Dollar',
        symbol: '$',
        tokenLogo: '/cUSD .svg',
        countryFlag: '/US.svg',
    },
    {
        code: 'cEUR',
        name: 'Euro',
        symbol: '€',
        tokenLogo: '/cEUR.svg',
        countryFlag: '/EUR.svg',
    },
    {
        code: 'cGBP',
        name: 'British Pound',
        symbol: '£',
        tokenLogo: '/cGBP.svg',
        countryFlag: '/GB .svg',
    },
    {
        code: 'cCAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        tokenLogo: '/cCAD.svg',
        countryFlag: '/CA .svg',
    },
    {
        code: 'cAUD',
        name: 'Australian Dollar',
        symbol: 'A$',
        tokenLogo: '/cAUD.svg',
        countryFlag: '/AU.svg',
    },
    {
        code: 'cCHF',
        name: 'Swiss Franc',
        symbol: 'CHF',
        tokenLogo: '/cCHF.svg',
        countryFlag: '/CH.svg',
    },
    {
        code: 'cJPY',
        name: 'Japanese Yen',
        symbol: '¥',
        tokenLogo: '/cJPY.svg',
        countryFlag: '/JP.svg',
    },
    {
        code: 'cREAL',
        name: 'Brazilian Real',
        symbol: 'R$',
        tokenLogo: '/cREAL.svg',
        countryFlag: '/BR.svg',
    },
    {
        code: 'cCOP',
        name: 'Colombian Peso',
        symbol: 'COP$',
        tokenLogo: '/cCOP.svg',
        countryFlag: '/CO.svg',
    },
    {
        code: 'cKES',
        name: 'Kenyan Shilling',
        symbol: 'KSh',
        tokenLogo: '/cKES.svg',
        countryFlag: '/KE.svg',
    },
    {
        code: 'cNGN',
        name: 'Nigerian Naira',
        symbol: '₦',
        tokenLogo: '/cNGN.svg',
        countryFlag: '/NG.svg',
    },
    {
        code: 'cZAR',
        name: 'South African Rand',
        symbol: 'R',
        tokenLogo: '/cZAR.svg',
        countryFlag: '/SA.svg',
    },
    {
        code: 'cGHS',
        name: 'Ghanaian Cedi',
        symbol: '₵',
        tokenLogo: '/cGHS.svg',
        countryFlag: '/GH .svg',
    },
    {
        code: 'eXOF',
        name: 'CFA Franc',
        symbol: 'XOF',
        tokenLogo: '/eXOF.svg',
        countryFlag: '/CF.svg',
    },
    {
        code: 'PUSO',
        name: 'Philippine Peso',
        symbol: '₱',
        tokenLogo: '/PUSO.svg',
        countryFlag: '/PH.svg',
    },
    {
        code: 'USDT',
        name: 'Tether USD',
        symbol: 'USD₮',
        tokenLogo: '/USDT.svg',
        countryFlag: '/US.svg',
    },
    {
        code: 'USDC',
        name: 'USD Coin',
        symbol: 'USDC',
        tokenLogo: '/USDC.svg',
        countryFlag: '/US.svg',
    },
    {
        code: 'CELO',
        name: 'Celo',
        symbol: 'CELO',
        tokenLogo: '/CELO.svg',
        countryFlag: '/US.svg',
    },
] as const;


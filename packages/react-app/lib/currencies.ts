import type { Currency } from './contracts';

export interface CurrencyOption {
    code: Currency;
    name: string;
    flag: string;
    symbol: string;
    tokenLogo: string;
    countryFlag: string;
}

export const CURRENCIES: CurrencyOption[] = [
    {
        code: 'cUSD',
        name: 'US Dollar',
        flag: '🇺🇸',
        symbol: '$',
        tokenLogo: '/cUSD .svg',
        countryFlag: '/US.svg',
    },
    {
        code: 'cEUR',
        name: 'Euro',
        flag: '🇪🇺',
        symbol: '€',
        tokenLogo: '/cEUR.svg',
        countryFlag: '/EUR.svg',
    },
    {
        code: 'cGBP',
        name: 'British Pound',
        flag: '🇬🇧',
        symbol: '£',
        tokenLogo: '/cGBP.svg',
        countryFlag: '/GB .svg',
    },
    {
        code: 'cCAD',
        name: 'Canadian Dollar',
        flag: '🇨🇦',
        symbol: 'C$',
        tokenLogo: '/cCAD.svg',
        countryFlag: '/CA .svg',
    },
    {
        code: 'cAUD',
        name: 'Australian Dollar',
        flag: '🇦🇺',
        symbol: 'A$',
        tokenLogo: '/cAUD.svg',
        countryFlag: '/AU.svg',
    },
    {
        code: 'cCHF',
        name: 'Swiss Franc',
        flag: '🇨🇭',
        symbol: 'CHF',
        tokenLogo: '/cCHF.svg',
        countryFlag: '/CH.svg',
    },
    {
        code: 'cJPY',
        name: 'Japanese Yen',
        flag: '🇯🇵',
        symbol: '¥',
        tokenLogo: '/cJPY.svg',
        countryFlag: '/JP.svg',
    },
    {
        code: 'cREAL',
        name: 'Brazilian Real',
        flag: '🇧🇷',
        symbol: 'R$',
        tokenLogo: '/cREAL.svg',
        countryFlag: '/BR.svg',
    },
    {
        code: 'cCOP',
        name: 'Colombian Peso',
        flag: '🇨🇴',
        symbol: 'COP$',
        tokenLogo: '/cCOP.svg',
        countryFlag: '/CO.svg',
    },
    {
        code: 'cKES',
        name: 'Kenyan Shilling',
        flag: '🇰🇪',
        symbol: 'KSh',
        tokenLogo: '/cKES.svg',
        countryFlag: '/KE.svg',
    },
    {
        code: 'cNGN',
        name: 'Nigerian Naira',
        flag: '🇳🇬',
        symbol: '₦',
        tokenLogo: '/cNGN.svg',
        countryFlag: '/NG.svg',
    },
    {
        code: 'cZAR',
        name: 'South African Rand',
        flag: '🇿🇦',
        symbol: 'R',
        tokenLogo: '/cZAR.svg',
        countryFlag: '/SA.svg',
    },
    {
        code: 'cGHS',
        name: 'Ghanaian Cedi',
        flag: '🇬🇭',
        symbol: '₵',
        tokenLogo: '/cGHS.svg',
        countryFlag: '/GH .svg',
    },
    {
        code: 'eXOF',
        name: 'CFA Franc',
        flag: '🌍',
        symbol: 'XOF',
        tokenLogo: '/eXOF.svg',
        countryFlag: '/CF.svg',
    },
    {
        code: 'PUSO',
        name: 'Philippine Peso',
        flag: '🇵🇭',
        symbol: '₱',
        tokenLogo: '/PUSO.svg',
        countryFlag: '/PH.svg',
    },
] as const;


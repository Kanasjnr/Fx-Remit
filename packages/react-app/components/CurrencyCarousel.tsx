"use client";

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface CurrencyCard {
  code: string;
  name: string;
  fullName: string;
  description: string;
}

const currencies: CurrencyCard[] = [
  {
    code: "cUSD",
    name: "US",
    fullName: "United States Dollar",
    description: "The fundamental component of the Mento ecosystem, providing a stable USD reference point for global transactions and trading pairs."
  },
  {
    code: "cEUR",
    name: "EU",
    fullName: "European Union",
    description: "A Euro-pegged decentralized stablecoin, supporting seamless international payment and FX trading within the Eurozone and beyond."
  },
  {
    code: "cREAL",
    name: "BRZ",
    fullName: "Brazilian Real",
    description: "Brazilian Real decentralized stablecoin, supporting financial access and stable value transfers in South America's largest economy."
  },
  {
    code: "cKES",
    name: "KE",
    fullName: "Kenyan Shilling",
    description: "Kenyan Shilling decentralized stablecoin for remittances, and mobile payment, ideal for business and users operating across Africa."
  },
  {
    code: "cNGN",
    name: "NG",
    fullName: "Nigerian Naira",
    description: "Nigerian Naira based decentralized stablecoin built for mobile payment, local lending, and remittances. Ideal for seamless swaps and transfers."
  },
  {
    code: "cGBP",
    name: "GB",
    fullName: "British Pound",
    description: "British Pound stablecoin enabling efficient GBP-denominated payments and FX trading, built for the most traded currencies in the world."
  },
  {
    code: "cCAD",
    name: "CA",
    fullName: "Canadian Dollar",
    description: "Canadian Dollar decentralized stablecoin, enabling stable value transfers and trade across North America."
  },
  {
    code: "cAUD",
    name: "AU",
    fullName: "Australian Dollar",
    description: "Decentralized stablecoin tracking the Australian Dollar, facilitating AUD-based payments, remittances and trading."
  },
  {
    code: "cCHF",
    name: "CH",
    fullName: "Swiss Franc",
    description: "Swiss Franc stablecoin offering onchain access to one of the world’s most stable and trusted currencies, designed for payments and FX trading."
  },
  {
    code: "cJPY",
    name: "JP",
    fullName: "Japanese Yen",
    description: "Japanese Yen stablecoin providing exposure to Asia’s key trading currency, optimized for regional and global FX use."
  },
  {
    code: "cCOP",
    name: "CO",
    fullName: "Colombian Peso",
    description: "Colombian Peso decentralized stablecoin built for local payments and remittances in Latin America."
  },
  {
    code: "cZAR",
    name: "SA",
    fullName: "South African Rand",
    description: "South African Rand stablecoin built to support commerce and FX activity across Africa’s most industralized economy."
  },
  {
    code: "cGHS",
    name: "GH",
    fullName: "Ghanaian Cedi",
    description: "Ghanaian Cedi decentralized stablecoin, supporting West African financial inclusion and trade."
  },
  {
    code: "eXOF",
    name: "CF",
    fullName: "CFA Franc",
    description: "West African CFA Franc decentralized enabling regional trade and FX activity across 14 African countries."
  },
  {
    code: "PUSO",
    name: "PH",
    fullName: "Philippine Peso",
    description: "philippine Peso decentralized stablecoin focused on remittances and digital commerce across Southeast Asia."
  }
];

export function CurrencyCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    const cardWidth = 382 + 20; // card width + gap

    const animate = () => {
      scrollPosition += scrollSpeed;
      
      // Reset position when we've scrolled through all cards
      if (scrollPosition >= currencies.length * cardWidth) {
        scrollPosition = 0;
      }
      
      container.style.transform = `translateX(-${scrollPosition}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

    return (
      <section className="hidden lg:block relative py-20 overflow-hidden -z-10" style={{ backgroundColor: '#000000' }}>
      {/* Background Map  */}
      <div className="absolute inset-0">
        <Image
          src="/Map.svg"
          alt="World Map"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-orange-500 font-bold py-3 px-8 text-sm uppercase tracking-wide mb-8 inline-block">
            TRY IT NOW
          </div>
          <h2 className="text-5xl font-bold text-white mb-4">
            Ready to make global transactions?
          </h2>
        </div>

        {/* Currency Cards Carousel */}
        <div className="relative h-64 overflow-hidden">
          <div 
            ref={containerRef}
            className="flex gap-5 absolute top-0 left-0"
            style={{ width: `${currencies.length * 2 * (382 + 20)}px` }}
          >
            {[...currencies, ...currencies].map((currency, index) => (
              <div
                key={`${currency.code}-${index}`}
                className="flex-shrink-0 bg-white rounded-2xl p-2 shadow-lg"
                style={{ width: '382px' }}
              >
                <div className="flex items-start gap-2">
                  {/* Circular Logo */}
                  <div 
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: '75px',
                      height: '75px',
                      borderRadius: '1000px',
                      padding: '10px',
                      boxShadow: '0px 4px 4px 2px #0000001A',
                      backgroundColor: '#F5F5F5'
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <Image
                        src={`/${currency.code}.svg`}
                        alt={`${currency.code} token`}
                        width={45}
                        height={45}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 relative">
                    {/* Card Number - All cards */}
                    <div className="absolute top-0 right-2">
                      <span 
                        className="font-medium text-5xl"
                        style={{ 
                          color: '#F4D7ACBF',
                          fontFamily: 'Inter',
                          fontWeight: 500,
                          fontSize: '48px',
                          lineHeight: '150%',
                          letterSpacing: '0%'
                        }}
                      >
                        {String((index % currencies.length) + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Currency Code */}
                    <div className="mb-1">
                      <span 
                        className="font-medium"
                        style={{ 
                          color: '#F18F01',
                          fontFamily: 'Inter',
                          fontWeight: 600,
                          fontSize: '20px',
                          lineHeight: '150%',
                          letterSpacing: '0%'
                        }}
                      >
                        {currency.code}
                      </span>
                    </div>
                    
                    {/* Country Name and Full Name - Side by side */}
                    <div className="mb-2 flex items-center gap-2">
                      <span 
                        className="font-medium"
                        style={{ 
                          color: '#050505',
                          fontFamily: 'Inter',
                          fontWeight: 500,
                          fontSize: '28px',
                          lineHeight: '150%',
                          letterSpacing: '0%'
                        }}
                      >
                        {currency.name}
                      </span>
                      <span 
                        className="font-normal"
                        style={{ 
                          color: '#050505',
                          fontFamily: 'Inter',
                          fontWeight: 400,
                          fontSize: '16px',
                          lineHeight: '150%',
                          letterSpacing: '0%'
                        }}
                      >
                        {currency.fullName}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p 
                      className="font-normal leading-relaxed"
                      style={{ 
                        color: '#050505BF',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '150%',
                        letterSpacing: '0%',
                        width: '250px'
                      }}
                    >
                      {currency.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

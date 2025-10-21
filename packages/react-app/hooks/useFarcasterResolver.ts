import { useState, useEffect } from 'react';

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

interface UseFarcasterResolverResult {
  resolveUsername: (username: string) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useFarcasterResolver(): UseFarcasterResolverResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveUsername = async (username: string): Promise<string | null> => {
    if (!username.startsWith('@')) {
      // If it doesn't start with @, assume it's already a wallet address
      return username;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cleanUsername = username.replace('@', '');
      
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/by_username/?username=${cleanUsername}`,
        {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'F4F85021-22B0-4BF0-B33B-53C1EF67DF82',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('API access requires payment. Please use wallet addresses directly (0x...) or contact support.');
        }
        throw new Error(`Failed to resolve username: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 Full API response:', data);
      
      if (data.user) {
        const user: FarcasterUser = data.user;
        console.log(' User data:', user);
        console.log(' Custody address:', user.custody_address);
        console.log(' Verified addresses:', user.verified_addresses);
        
        if (user.verified_addresses?.eth_addresses?.length > 0) {
          console.log(' Using first verified ETH address:', user.verified_addresses.eth_addresses[0]);
          return user.verified_addresses.eth_addresses[0];
        } else if (user.custody_address) {
          console.log(' Using custody address (fallback):', user.custody_address);
          return user.custody_address;
        }
      }

      console.log(' No valid address found in response');
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve username';
      setError(errorMessage);
      console.error('Farcaster username resolution error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resolveUsername,
    isLoading,
    error,
  };
}

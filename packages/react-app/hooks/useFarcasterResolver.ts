import { useState, useCallback } from 'react';

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

  const resolveUsername = useCallback(async (username: string) => {
    if (!username.startsWith('@')) {
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
        if (response.status === 404) {
          throw new Error(`Username ${username} not found. Check the spelling or use a wallet address`);
        }
        if (response.status === 402) {
          throw new Error('Username lookup service temporarily unavailable');
        }
        if (response.status >= 500) {
          throw new Error('Service temporarily down. Please try again in a moment');
        }
        throw new Error('Unable to resolve username. Please try again');
      }

      const data = await response.json();
      
      if (data.user) {
        const user: FarcasterUser = data.user;
        
        if (user.verified_addresses?.eth_addresses?.length > 0) {
          return user.verified_addresses.eth_addresses[0];
        }
        
        if (user.custody_address) {
          return user.custody_address;
        }
        
        throw new Error(`${username} has no verified wallet address. Ask them to connect one`);
      }

      throw new Error('Unable to find wallet address for this username');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve username';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    resolveUsername,
    isLoading,
    error,
  };
}

"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

type TransactionStatus = "idle" | "processing" | "success" | "failure";

type Callbacks = {
  onRetry?: () => void;
  onReset?: () => void;
};

type FailedTransaction = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  recipient: string;
  errorReason: string;
  timestamp: number;
  userAddress: string;
};

type TxState = {
  status: TransactionStatus;
  title?: string;
  message?: string;
  txHash?: string;
  errorReason?: string;
  startedAt?: number;
  callbacks?: Callbacks;
  transactionData?: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
    recipient: string;
  };
};

type TxContextValue = {
  state: TxState;
  startProcessing: (opts?: { title?: string; message?: string; onRetry?: () => void; onReset?: () => void; txHash?: string; transactionData?: { fromCurrency: string; toCurrency: string; amount: string; recipient: string } }) => void;
  markSuccess: (opts?: { title?: string; message?: string; txHash?: string }) => void;
  markFailure: (opts: { reason: string; title?: string; txHash?: string }) => void;
  clear: () => void;
};

const TransactionStatusContext = createContext<TxContextValue | undefined>(undefined);

const saveFailedTransaction = (transaction: FailedTransaction) => {
  try {
    const key = `failed_transactions_${transaction.userAddress}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [...existing, transaction];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save failed transaction:', error);
  }
};

export const getFailedTransactions = (userAddress: string): FailedTransaction[] => {
  try {
    const key = `failed_transactions_${userAddress}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (error) {
    console.error('Failed to load failed transactions:', error);
    return [];
  }
};

export function TransactionStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TxState>({ status: "idle" });
  const [userAddress, setUserAddress] = useState<string>('');

  React.useEffect(() => {
    const storedAddress = localStorage.getItem('current_user_address');
    if (storedAddress) {
      setUserAddress(storedAddress);
    }
  }, []);

  const startProcessing: TxContextValue["startProcessing"] = useCallback((opts) => {
    setState({
      status: "processing",
      title: opts?.title ?? "Processing…",
      message: opts?.message ?? "This may take ~15–30 seconds.",
      txHash: opts?.txHash,
      startedAt: Date.now(),
      callbacks: { onRetry: opts?.onRetry, onReset: opts?.onReset },
      transactionData: opts?.transactionData,
    });
  }, []);

  const markSuccess: TxContextValue["markSuccess"] = useCallback((opts) => {
    setState((prev) => ({
      status: "success",
      title: opts?.title ?? "Success",
      message: opts?.message ?? "You have successfully completed your transaction",
      txHash: opts?.txHash ?? prev.txHash,
      startedAt: prev.startedAt,
      callbacks: prev.callbacks,
      transactionData: prev.transactionData, // Keep transaction data for sharing
    }));
  }, []);

  const markFailure: TxContextValue["markFailure"] = useCallback((opts) => {
    setState((prev) => {
      if (prev.transactionData && userAddress) {
        const failedTransaction: FailedTransaction = {
          id: `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fromCurrency: prev.transactionData.fromCurrency,
          toCurrency: prev.transactionData.toCurrency,
          amount: prev.transactionData.amount,
          recipient: prev.transactionData.recipient,
          errorReason: opts.reason,
          timestamp: Date.now(),
          userAddress: userAddress,
        };
        saveFailedTransaction(failedTransaction);
      }

      return {
        status: "failure",
        title: opts.title ?? "Failed",
        message: undefined,
        errorReason: opts.reason,
        txHash: opts.txHash ?? prev.txHash,
        startedAt: prev.startedAt,
        callbacks: prev.callbacks,
      };
    });
  }, [userAddress]);

  const clear = useCallback(() => setState({ status: "idle" }), []);

  const value = useMemo<TxContextValue>(() => ({ state, startProcessing, markSuccess, markFailure, clear }), [state, startProcessing, markSuccess, markFailure, clear]);

  return (
    <TransactionStatusContext.Provider value={value}>
      {children}
      <TxStatusOverlay />
    </TransactionStatusContext.Provider>
  );
}

export function useTransactionStatus(): TxContextValue {
  const ctx = useContext(TransactionStatusContext);
  if (!ctx) throw new Error("useTransactionStatus must be used within TransactionStatusProvider");
  return ctx;
}

// Currency symbols mapping
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    cUSD: "$", cEUR: "€", cGBP: "£", cCAD: "C$", cAUD: "A$", 
    cCHF: "CHF", cJPY: "¥", cREAL: "R$", cCOP: "COP$", 
    cKES: "KSh", cNGN: "₦", cZAR: "R", cGHS: "₵", 
    eXOF: "XOF", PUSO: "₱"
  };
  return symbols[currency] || "";
};

// Handle share on Farcaster
const handleShareOnFarcaster = async (state: TxState) => {
  try {
    const txData = state.transactionData;
    if (!txData) return;

    const { fromCurrency, toCurrency, amount } = txData;
    const fromSymbol = getCurrencySymbol(fromCurrency);

    // Create engaging share message
    const shareText = `Just sent money across borders with @fxremit! 

 ${fromSymbol}${amount} ${fromCurrency} → ${toCurrency}
 Instant settlement
 Only 1.5% fees
 15+ countries supported

Try it: https://fx-remit.xyz`;

    // Dynamically import Farcaster SDK
    const { sdk } = await import('@farcaster/miniapp-sdk');
    
    // Use Farcaster SDK to compose cast
    await sdk.actions.composeCast({
      text: shareText,
      embeds: ["https://fx-remit.xyz"]
    });
  } catch (error) {
    console.error("Failed to compose cast:", error);
  }
};

function TxStatusOverlay() {
  const { state, clear } = useTransactionStatus();
  const { isMiniApp } = useFarcasterMiniApp();

  if (state.status === "idle") return null;

  const isProcessing = state.status === "processing";
  const isSuccess = state.status === "success";
  const isFailure = state.status === "failure";

  const bg = isSuccess ? "bg-blue-600" : isFailure ? "bg-red-600" : "bg-blue-600";
  const title = state.title ?? (isProcessing ? "Processing…" : isSuccess ? "Success" : "Failed");

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-6">
        {/* Icon */}
        <div className="mx-auto mt-8 mb-10 h-40 w-40 rounded-3xl bg-gradient-to-b from-gray-300 to-white flex items-center justify-center">
          {isProcessing ? (
            <Hourglass />
          ) : (
            <div className={`h-24 w-24 rounded-full ${bg} flex items-center justify-center`}> 
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                {isSuccess ? (
                  <path d="M5 13l4 4L19 7" />
                ) : (
                  <path d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
          )}
        </div>

        {/* Text */}
        <h2 className="text-4xl font-extrabold text-center text-gray-900">{title}</h2>
        {isProcessing && (
          <p className="mt-4 text-center text-gray-600">{state.message}</p>
        )}
        {isSuccess && (
          <p className="mt-4 text-center text-gray-600">{state.message}</p>
        )}
        {isFailure && (
          <p className="mt-4 text-center text-gray-600">{state.errorReason ?? "The transaction failed."}</p>
        )}

        {/* CTAs */}
        <div className="mt-12">
          {isProcessing ? (
            <button disabled className="w-full rounded-2xl bg-gray-300 py-4 text-white font-semibold">Processing…</button>
          ) : isSuccess ? (
            <div className="space-y-4">
              {/* Only show Share button in Farcaster Mini App */}
              {isMiniApp && (
                <button
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-4 text-white font-semibold flex items-center justify-center space-x-2"
                  onClick={() => handleShareOnFarcaster(state)}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                  </svg>
                  <span>Share on Farcaster</span>
                </button>
              )}
              <button
                className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-4 text-white font-semibold"
                onClick={() => {
                  state.callbacks?.onReset?.();
                  clear();
                }}
              >
                New transfer
              </button>
              <a
                href="/history"
                className="block w-full text-center rounded-2xl bg-gray-100 hover:bg-gray-200 py-4 text-gray-800 font-semibold"
              >
                View history
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                className="w-full rounded-2xl bg-red-600 hover:bg-red-700 py-4 text-white font-semibold"
                onClick={() => state.callbacks?.onRetry?.()}
              >
                Try again
              </button>
              <button
                className="w-full rounded-2xl bg-gray-100 hover:bg-gray-200 py-4 text-gray-800 font-semibold"
                onClick={() => clear()}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Hourglass() {
  return (
    <div className="relative h-24 w-24">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-20 w-20">
          <defs>
            <linearGradient id="glass" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e5edf9" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          {/* Frame */}
          <rect x="14" y="6" width="36" height="6" rx="3" fill="#1e3a8a" />
          <rect x="14" y="52" width="36" height="6" rx="3" fill="#1e3a8a" />
          {/* Bulbs */}
          <path d="M18 12h28c0 10-12 12-14 20-2-8-14-10-14-20z" fill="url(#glass)" stroke="#93c5fd" />
          <path d="M18 52h28c0-10-12-12-14-20-2 8-14 10-14 20z" fill="url(#glass)" stroke="#93c5fd" />
          {/* Sand Top */}
          <path className="hourglass-sand-top" d="M22 22c6 0 10-2 10-4s-4-4-10-4" fill="#2563eb" />
          {/* Stream */}
          <rect className="hourglass-stream" x="31" y="31" width="2" height="8" rx="1" fill="#2563eb" />
          {/* Sand Bottom */}
          <path className="hourglass-sand-bottom" d="M22 46c8 0 14-2 14-6 0-2-4-4-10-4s-10 2-10 4c0 4 6 6 14 6" fill="#2563eb" />
        </svg>
      </div>
      <style jsx>{`
        .hourglass-sand-top {
          transform-origin: 32px 24px;
          animation: sandTop 1.6s linear infinite;
        }
        .hourglass-stream {
          animation: stream 0.8s linear infinite;
        }
        .hourglass-sand-bottom {
          transform-origin: 32px 44px;
          animation: sandBottom 1.6s linear infinite;
        }
        @keyframes sandTop {
          0% { opacity: 1; transform: scaleY(1); }
          45% { opacity: .6; transform: scaleY(.3); }
          50% { opacity: 0; transform: scaleY(0); }
          100% { opacity: 0; transform: scaleY(0); }
        }
        @keyframes stream {
          0% { opacity: 0; height: 0; }
          15% { opacity: 1; height: 8px; }
          85% { opacity: 1; height: 8px; }
          100% { opacity: 0; height: 0; }
        }
        @keyframes sandBottom {
          0% { transform: scaleY(.5); }
          50% { transform: scaleY(.9); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}



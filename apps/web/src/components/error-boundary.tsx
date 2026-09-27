'use client';

import React from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: Props) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-zinc-100">
            <div className="size-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Something went wrong</h2>
            <p className="text-zinc-600 mb-6">
              An unexpected error occurred. Our team has been notified and we're looking into it.
            </p>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => resetError()}
                className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-200"
              >
                Try Again
              </button>
              
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl border border-zinc-200 transition-all duration-200"
              >
                Go to Homepage
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-100">
              <p className="text-xs text-zinc-400">
                Error ID: <span className="font-mono text-zinc-500 uppercase">{Sentry.lastEventId() || 'unknown'}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

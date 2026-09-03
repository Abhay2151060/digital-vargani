'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-3xl mb-4 font-bold shadow-sm">
        ⚠️
      </div>
      <h2 className="text-2xl font-extrabold text-[#292118] mb-2">काहीतरी चूक झाली (500)</h2>
      <p className="text-sm text-[#6B6459] max-w-sm mb-6">
        सिस्टममध्ये तांत्रिक अडचण आली आहे. कृपया पुन्हा प्रयत्न करा.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-[#F97316] text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition"
      >
        पुन्हा प्रयत्न करा
      </button>
    </div>
  );
}

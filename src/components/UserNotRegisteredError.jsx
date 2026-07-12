import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#060608] px-4 font-sans">
      <div className="max-w-md w-full p-8 bg-[#111115] rounded-xl shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4 uppercase tracking-widest">Tilgang Nektet</h1>
          <p className="text-[13px] text-[#888888] font-mono leading-relaxed mb-8">
            Du har ikke autorisasjon til dette systemet. Vennligst kontakt systemadministrator for tilgangsrettigheter.
          </p>
          <div className="p-5 bg-white/5 border border-white/10 rounded-lg text-left shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#888888] mb-3">Feilsøking:</p>
            <ul className="list-none space-y-2 text-[12px] text-[#888888] font-mono">
              <li className="flex items-start"><span className="text-[#ff6a00] mr-2">›</span> Verifiser at du benytter korrekt identifikator</li>
              <li className="flex items-start"><span className="text-[#ff6a00] mr-2">›</span> Send forespørsel til administrator</li>
              <li className="flex items-start"><span className="text-[#ff6a00] mr-2">›</span> Tøm sesjon og autentiser på nytt</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
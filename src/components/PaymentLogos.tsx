import React from 'react';

export function PaymentLogos() {
  return (
    <div className="flex flex-col gap-3 items-center lg:items-start w-full lg:w-auto">
      {/* Riga 1 — Metodi di pagamento diretti */}
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
        {/* Visa */}
        <div
          title="Visa"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#1A1F71', borderRadius: 5, height: 28, padding: '0 10px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <span style={{ color: 'white', fontStyle: 'italic', fontWeight: 900, fontSize: 13, fontFamily: "'Times New Roman',Georgia,serif", letterSpacing: 1 }}>
            VISA
          </span>
        </div>

        {/* Mastercard */}
        <div
          title="Mastercard"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#252525', borderRadius: 5, height: 28, padding: '0 7px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <svg viewBox="0 0 38 22" width={38} height={22} xmlns="http://www.w3.org/2000/svg">
            <circle cx={14} cy={11} r={10} fill="#EB001B" />
            <circle cx={24} cy={11} r={10} fill="#F79E1B" opacity={0.9} />
            <path d="M19 3.27a10 10 0 0 1 0 15.46 10 10 0 0 1 0-15.46z" fill="#FF5F00" />
          </svg>
        </div>

        {/* PayPal */}
        <div
          title="PayPal"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#F5F5F5', borderRadius: 5, height: 28, padding: '0 8px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <span style={{ fontWeight: 700, fontSize: 12, fontFamily: 'Arial,sans-serif' }}>
            <span style={{ color: '#253B80' }}>Pay</span>
            <span style={{ color: '#179BD7' }}>Pal</span>
          </span>
        </div>

        {/* Apple Pay */}
        <div
          title="Apple Pay"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#000', borderRadius: 5, height: 28, padding: '0 8px', gap: 3,
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 17" height={14} fill="white">
            <path d="M13.37 5.73c-.08.06-1.42.82-1.42 2.5 0 1.96 1.72 2.65 1.77 2.67-.01.08-.27.95-.9 1.83-.56.78-1.15 1.56-2.01 1.56s-1.09-.5-2.08-.5c-.97 0-1.32.5-2.1.5-.78 0-1.35-.74-2-1.55C3.82 11.76 3 9.9 3 8.14c0-2.79 1.82-4.27 3.6-4.27.95 0 1.74.62 2.33.62.57 0 1.47-.66 2.57-.66.41 0 1.5.04 2.27 1.04l.6.86zM9.5 2.46c.44-.53.75-1.26.75-1.99 0-.1-.01-.21-.03-.3-.72.03-1.57.48-2.08 1.07-.41.47-.78 1.19-.78 1.93 0 .11.02.22.03.25.05.01.13.02.2.02.64 0 1.47-.42 1.91-.98z" />
          </svg>
          <span style={{ color: 'white', fontSize: 11, fontFamily: '-apple-system,BlinkMacSystemFont,Arial,sans-serif', fontWeight: 600 }}>Pay</span>
        </div>

        {/* Google Pay */}
        <div
          title="Google Pay"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'white', borderRadius: 5, height: 28, padding: '0 8px', gap: 3,
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <svg viewBox="0 0 18 18" height={14} xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          <span style={{ fontSize: 11, fontFamily: 'Arial,sans-serif', fontWeight: 600, color: '#3C4043' }}>Pay</span>
        </div>

        {/* Contrassegno */}
        <div
          title="Pagamento alla Consegna (Contrassegno)"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: '#3F3F46', borderRadius: 5, height: 28, padding: '0 8px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x={1} y={3} width={15} height={13} />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx={5.5} cy={18.5} r={2.5} />
            <circle cx={18.5} cy={18.5} r={2.5} />
          </svg>
          <span style={{ color: 'white', fontSize: 10, fontFamily: 'Arial,sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>Contrassegno</span>
        </div>
      </div>

      {/* Riga 2 — Pagamento a rate */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <span style={{ color: '#52525B', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>Paga a rate:</span>

        {/* Klarna */}
        <div
          title="Klarna — 3 rate senza interessi"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#FFB3C7', borderRadius: 5, height: 24, padding: '0 8px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <span style={{ color: '#1A1A1A', fontWeight: 700, fontSize: 11, fontFamily: 'Arial,sans-serif', letterSpacing: -0.3 }}>Klarna</span>
        </div>

        {/* Scalapay */}
        <div
          title="Scalapay — 3 rate senza interessi"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#00D26A', borderRadius: 5, height: 24, padding: '0 8px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: 11, fontFamily: 'Arial,sans-serif' }}>Scalapay</span>
        </div>

        {/* Cofidis */}
        <div
          title="Cofidis — Finanziamento fino a 60 rate"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#E30613', borderRadius: 5, height: 24, padding: '0 8px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: 11, fontFamily: 'Arial,sans-serif' }}>Cofidis</span>
        </div>

        {/* Sofort */}
        <div
          title="Sofort — Bonifico istantaneo"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#EF809F', borderRadius: 5, height: 24, padding: '0 8px',
            opacity: 0.8, transition: 'opacity 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.8')}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: 11, fontFamily: 'Arial,sans-serif' }}>Sofort</span>
        </div>
      </div>
    </div>
  );
}

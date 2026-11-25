import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CHEATSHEETS } from '../../data/viewsData';

export const CheatsheetsView: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(CHEATSHEETS.map((c) => c.category)))];
  const visible =
    filter === 'All' ? CHEATSHEETS : CHEATSHEETS.filter((c) => c.category === filter);

  const handleCopy = (cardId: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(cardId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="secondary-view">
      <div className="view-container">
        <div
          className="view-card"
          style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              System Design Cheatsheets
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Quick reference numbers, protocols, and trade-offs for interviews and architecture reviews.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`tactile-btn ${filter === cat ? 'primary' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 14,
          }}
        >
          {visible.map((card) => {
            const plainText = card.items
              .map((i) => `${i.label}: ${i.value}${i.note ? ` (${i.note})` : ''}`)
              .join('\n');

            return (
              <div key={card.id} className="view-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
                      {card.category.toUpperCase()}
                    </div>
                    <h2 style={{ margin: '2px 0 0', fontSize: 14.5, fontWeight: 700 }}>
                      {card.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="tactile-btn"
                    style={{ height: 26, padding: '0 8px', fontSize: 10.5 }}
                    onClick={() => handleCopy(card.id, plainText)}
                  >
                    {copiedId === card.id ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === card.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {card.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '7px 10px',
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-inset)',
                        border: '1px solid var(--border-card)',
                        fontSize: 11.5,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.label}</div>
                        {item.note && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.note}</div>
                        )}
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--olive-text)',
                          backgroundColor: 'var(--olive-bg)',
                          border: '1px solid var(--olive-border)',
                          padding: '2px 8px',
                          borderRadius: 5,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

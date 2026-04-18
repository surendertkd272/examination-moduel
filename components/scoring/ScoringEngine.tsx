'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { ScoringCategory } from '@/context/DataContext';

interface ScoringEngineProps {
  rubricConfig: ScoringCategory[];
  initialScores?: Record<string, number | string>;
  onScoreChange: (scores: Record<string, number | string>, total: number) => void;
}

/**
 * Dynamic Scoring Engine — each item carries its own max_score.
 * Supports:
 *  - Numeric categories (buttons or +/- stepper)
 *  - Half-point (0.5) items
 *  - Select categories (single-choice dropdown)
 *  - Text categories (free-text textarea)
 */
export default function ScoringEngine({
  rubricConfig,
  initialScores = {},
  onScoreChange,
}: ScoringEngineProps) {
  // Hydrate from initialScores once on mount only. Subsequent re-renders of
  // the parent (e.g. 20s data polls) must NOT wipe out in-progress edits —
  // the earlier effect that copied initialScores into state on every change
  // was overwriting drafts the jury had just typed.
  const [scores, setScores] = useState<Record<string, number | string>>(() => initialScores);

  useEffect(() => {
    const total = Object.values(scores).reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    onScoreChange(scores, total);
  }, [scores]);  // eslint-disable-line react-hooks/exhaustive-deps

  const updateVal = (key: string, val: number | string) =>
    setScores(prev => ({ ...prev, [key]: val }));

  // Total possible = sum of each numeric item's own max_score (text/select don't count)
  // CRITICAL: Exclude "Miscellaneous Questions" category entirely as per requirements.
  const scoringCategories = rubricConfig.filter(c => 
    (!c.type || c.type === 'numeric') && c.name !== 'Miscellaneous Questions'
  );
  
  const maxPossible = scoringCategories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, item) => s + item.max_score, 0),
    0,
  );

  // Filter scores to only include items from scoring categories
  const currentTotal = Object.entries(scores).reduce<number>((sum, [key, val]) => {
    // Check if key belongs to an excluded category
    if (key.startsWith('Miscellaneous Questions_')) return sum;
    return sum + (typeof val === 'number' ? val : 0);
  }, 0);

  const totalNumericItems = scoringCategories.reduce((s, c) => s + c.items.length, 0);
  const filledNumericCount = scoringCategories.reduce((s, c) => {
    return s + c.items.filter(i => scores[`${c.name}_${i.name}`] !== undefined).length;
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Progress summary */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Progress</div>
          <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>
            {filledNumericCount} of {totalNumericItems} items scored
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-color)' }}>
            {currentTotal}
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/{maxPossible}</span>
          </div>
        </div>
      </div>

      {rubricConfig.map(section => {
        const sectionType = section.type || 'numeric';

        // ─── TEXT SECTION (Remarks by Jury) ───
        if (sectionType === 'text') {
          return (
            <div key={section.name} style={{
              background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)',
              borderLeft: '4px solid #8b5cf6', overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{section.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Free text — does not affect score total</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px', background: '#f5f3ff', color: '#8b5cf6' }}>
                  Text
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {section.items.map(item => {
                  const key = `${section.name}_${item.name}`;
                  return (
                    <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{item.name}</span>
                      <textarea
                        value={(scores[key] as string) || ''}
                        onChange={e => updateVal(key, e.target.value)}
                        placeholder={`Enter ${item.name.toLowerCase()}...`}
                        rows={3}
                        style={{
                          width: '100%', padding: '12px', fontSize: '14px', borderRadius: '10px',
                          border: '1px solid var(--border-color)', background: '#fafafa', resize: 'vertical',
                          fontFamily: 'inherit', lineHeight: 1.6, minHeight: '80px',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // ─── SELECT SECTION (Objective) ───
        if (sectionType === 'select') {
          return (
            <div key={section.name} style={{
              background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)',
              borderLeft: '4px solid #f59e0b', overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{section.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select one option — does not affect score total</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px', background: '#fffbeb', color: '#f59e0b' }}>
                  Select
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {section.items.map(item => {
                  const key = `${section.name}_${item.name}`;
                  const current = scores[key] as string || '';
                  return (
                    <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>{item.name}</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(section.options || []).map(opt => (
                          <button
                            key={opt}
                            onClick={() => updateVal(key, opt)}
                            style={{
                              padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '13px',
                              minHeight: '42px', minWidth: 'auto',
                              border: current === opt ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                              background: current === opt ? '#fef3c7' : 'white',
                              color: current === opt ? '#92400e' : '#374151',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // ─── NUMERIC SECTION (default) ───
        const sectionMax = section.items.reduce((s, i) => s + i.max_score, 0);
        const sectionScore = section.items.reduce((s, i) => {
          const v = scores[`${section.name}_${i.name}`];
          return s + (typeof v === 'number' ? v : 0);
        }, 0);

        return (
          <div key={section.name} style={{
            background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)',
            borderLeft: '4px solid var(--primary-color)', overflow: 'hidden',
          }}>
            {/* Section header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{section.name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {section.items.length} items • Per-item scores
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, padding: '4px 12px', borderRadius: '6px', background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                {sectionScore}/{sectionMax}
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {section.items.map(item => {
                const itemType = item.type || 'numeric';
                const key = `${section.name}_${item.name}`;
                const rawVal = scores[key];
                const val = (typeof rawVal === 'number' ? rawVal : 0);
                const max = item.max_score;

                // ─── ITEM TYPE: TEXT / ALPHA-NUMERIC ───
                if (itemType === 'text') {
                  return (
                    <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{item.name}</span>
                      <input
                        type="text"
                        value={(rawVal as string) || ''}
                        onChange={e => updateVal(key, e.target.value)}
                        placeholder="Type here..."
                        style={{
                          width: '100%', padding: '12px', fontSize: '14px', borderRadius: '10px',
                          border: '1px solid var(--border-color)', background: '#fafafa',
                        }}
                      />
                    </div>
                  );
                }

                // ─── ITEM TYPE: NUMBER (Numeric typing) ───
                if (itemType === 'number') {
                  return (
                    <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{item.name}</span>
                      <input
                        type="number"
                        value={rawVal ?? ''}
                        onChange={e => updateVal(key, e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        style={{
                          width: '100%', padding: '12px', fontSize: '14px', borderRadius: '10px',
                          border: '1px solid var(--border-color)', background: '#fafafa',
                        }}
                      />
                    </div>
                  );
                }

                // ─── ITEM TYPE: SELECT (Buttons) ───
                if (itemType === 'select') {
                  const current = scores[key] as string || '';
                  return (
                    <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{item.name}</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(item.options || []).map(opt => (
                          <button
                            key={opt}
                            onClick={() => updateVal(key, opt)}
                            style={{
                              padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '13px',
                              minHeight: '44px', minWidth: '80px', flex: 1,
                              border: current === opt ? '2px solid var(--primary-color)' : '2px solid #e5e7eb',
                              background: current === opt ? 'var(--primary-color)' : 'white',
                              color: current === opt ? 'white' : '#374151',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                // ─── ITEM TYPE: NUMERIC (Existing slider/stepper) ───
                const step = max % 1 !== 0 ? 0.5 : 1;
                const buttonValues = Array.from(
                  { length: Math.round(max / step) + 1 },
                  (_, i) => parseFloat((i * step).toFixed(1)),
                );
                const useButtons = max <= 5;

                return (
                  <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{item.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-color)' }}>
                        {val}/{max}
                      </span>
                    </div>

                    {useButtons ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {buttonValues.map(btnVal => (
                          <button
                            key={btnVal}
                            onClick={() => updateVal(key, btnVal)}
                            style={{
                              flex: buttonValues.length <= 6 ? 1 : undefined,
                              minWidth: '44px',
                              minHeight: '48px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '15px',
                              border: val === btnVal ? '2px solid var(--primary-color)' : '2px solid #e5e7eb',
                              background: val === btnVal ? 'var(--primary-color)' : 'white',
                              color: val === btnVal ? 'white' : '#374151',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {btnVal}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                          onClick={() => updateVal(key, parseFloat(Math.max(0, val - 1).toFixed(1)))}
                          style={{ minHeight: '48px', minWidth: '48px', padding: '0', borderRadius: '10px', background: '#f3f4f6', border: '2px solid #e5e7eb', color: '#374151' }}
                        >
                          <Minus size={20} />
                        </button>
                        <div style={{ flex: 1, textAlign: 'center', fontSize: '28px', fontWeight: 800, color: 'var(--primary-color)', borderBottom: '3px solid var(--border-color)', paddingBottom: '4px' }}>
                          {val}
                        </div>
                        <button
                          onClick={() => updateVal(key, parseFloat(Math.min(max, val + 1).toFixed(1)))}
                          style={{ minHeight: '48px', minWidth: '48px', padding: '0', borderRadius: '10px', background: 'var(--primary-color)', border: 'none', color: 'white' }}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

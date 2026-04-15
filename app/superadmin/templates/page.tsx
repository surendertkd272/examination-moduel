'use client';

import React, { useState, useEffect } from 'react';
import { useData, ScoringTemplate, ScoringCategory } from '@/context/DataContext';
import { Save, AlertCircle, Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function TemplatesPage() {
  const { scoringTemplates, updateScoringTemplates } = useData();
  const [templates, setTemplates] = useState<Record<string, ScoringTemplate>>({});
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTemplates(JSON.parse(JSON.stringify(scoringTemplates)));
  }, [scoringTemplates]);

  const markChanged = () => setHasChanges(true);

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateScoringTemplates(templates);
    setSaving(false);
    if (ok) { setSaved(true); setHasChanges(false); setTimeout(() => setSaved(false), 2000); }
  };

  // ── template-level helpers ─────────────────────────────────────────────────
  const updateTemplate = (level: string, field: string, value: any) => {
    setTemplates(prev => ({ ...prev, [level]: { ...prev[level], [field]: value } }));
    markChanged();
  };

  // ── category helpers ───────────────────────────────────────────────────────
  const updateCategoryName = (level: string, catIdx: number, value: string) => {
    setTemplates(prev => {
      const cats = [...prev[level].categories];
      cats[catIdx] = { ...cats[catIdx], name: value };
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  const updateCategoryDefault = (level: string, catIdx: number, value: number) => {
    setTemplates(prev => {
      const cats = [...prev[level].categories];
      cats[catIdx] = { ...cats[catIdx], max_score: value };
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  const addCategory = (level: string) => {
    setTemplates(prev => {
      const t = prev[level];
      return {
        ...prev,
        [level]: {
          ...t,
          categories: [...t.categories, { name: 'New Category', items: [{ name: 'Item 1', max_score: 5 }], max_score: 5 }],
        },
      };
    });
    markChanged();
  };

  const removeCategory = (level: string, catIdx: number) => {
    setTemplates(prev => {
      const cats = [...prev[level].categories];
      cats.splice(catIdx, 1);
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  // ── item helpers ───────────────────────────────────────────────────────────
  const addItem = (level: string, catIdx: number) => {
    setTemplates(prev => {
      const cats = [...prev[level].categories];
      const cat  = cats[catIdx];
      cats[catIdx] = { ...cat, items: [...cat.items, { name: 'New Item', max_score: cat.max_score }] };
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  const removeItem = (level: string, catIdx: number, itemIdx: number) => {
    setTemplates(prev => {
      const cats  = [...prev[level].categories];
      const items = [...cats[catIdx].items];
      items.splice(itemIdx, 1);
      cats[catIdx] = { ...cats[catIdx], items };
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  const updateItemName = (level: string, catIdx: number, itemIdx: number, value: string) => {
    setTemplates(prev => {
      const cats  = [...prev[level].categories];
      const items = [...cats[catIdx].items];
      items[itemIdx] = { ...items[itemIdx], name: value };
      cats[catIdx] = { ...cats[catIdx], items };
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  const updateItemScore = (level: string, catIdx: number, itemIdx: number, value: number) => {
    setTemplates(prev => {
      const cats  = [...prev[level].categories];
      const items = [...cats[catIdx].items];
      items[itemIdx] = { ...items[itemIdx], max_score: value };
      cats[catIdx] = { ...cats[catIdx], items };
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  const updateCategoryType = (level: string, catIdx: number, value: 'numeric' | 'text' | 'select') => {
    setTemplates(prev => {
      const cats = [...prev[level].categories];
      cats[catIdx] = { ...cats[catIdx], type: value };
      return { ...prev, [level]: { ...prev[level], categories: cats } };
    });
    markChanged();
  };

  // ── level helpers ──────────────────────────────────────────────────────────
  const addLevel = () => {
    const nextLevel = String(Math.max(...Object.keys(templates).map(Number), 0) + 1);
    setTemplates(prev => ({
      ...prev,
      [nextLevel]: {
        levelName: `Level ${nextLevel}`,
        passThreshold: 70,
        categories: [{ name: 'Dress Code', items: [{ name: 'Helmet', max_score: 5 }], max_score: 5 }],
      },
    }));
    setExpandedLevel(nextLevel);
    markChanged();
  };

  // ── derived values ─────────────────────────────────────────────────────────
  const getMaxPossible = (t: ScoringTemplate) =>
    t.categories.reduce((sum, cat) => sum + cat.items.reduce((s, item) => s + item.max_score, 0), 0);

  const levelKeys = Object.keys(templates).sort((a, b) => Number(a) - Number(b));

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Scoring Templates</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Configure per-item scores per level. Each item can have its own max score.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={addLevel} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', background: 'white', color: 'var(--primary-color)', border: '2px solid var(--primary-color)' }}>
            <Plus size={16} /> Add Level
          </button>
          <button onClick={handleSave} disabled={saving || saved || !hasChanges}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 24px', background: saved ? '#10b981' : hasChanges ? 'var(--primary-color)' : '#9ca3af' }}>
            {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving…' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div style={{ background: '#fefce8', border: '2px solid #fde68a', padding: '12px 16px', borderRadius: '10px', display: 'flex', gap: '10px', color: '#854d0e', fontSize: '13px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>You have unsaved changes. Click <strong>Save Changes</strong> to persist.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {levelKeys.map(level => {
          const t          = templates[level];
          const isExpanded = expandedLevel === level;
          const maxPossible = getMaxPossible(t);

          return (
            <div key={level} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {/* Level header */}
              <div
                onClick={() => setExpandedLevel(isExpanded ? null : level)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 800, fontSize: '16px' }}>
                    {level}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{t.levelName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t.categories.length} categories • Max {maxPossible} pts • Pass: {t.passThreshold}%
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding: '24px' }}>
                  {/* Level metadata */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Level Name</label>
                      <input type="text" value={t.levelName} onChange={e => updateTemplate(level, 'levelName', e.target.value)} style={{ fontSize: '13px', minHeight: '38px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Pass Threshold (%)</label>
                      <input type="number" min={0} max={100} value={t.passThreshold} onChange={e => updateTemplate(level, 'passThreshold', parseInt(e.target.value) || 70)} style={{ fontSize: '13px', minHeight: '38px' }} />
                    </div>
                  </div>

                  {/* Categories */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {t.categories.map((cat, catIdx) => {
                      const catTotal = cat.items.reduce((s, i) => s + i.max_score, 0);
                      return (
                        <div key={catIdx} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                          {/* Category header row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                              <input
                                type="text"
                                value={cat.name}
                                onChange={e => updateCategoryName(level, catIdx, e.target.value)}
                                style={{ fontWeight: 700, fontSize: '14px', border: 'none', borderBottom: '2px solid var(--border-color)', borderRadius: 0, padding: '4px 0', flex: 1, minHeight: 'auto', boxShadow: 'none', background: 'transparent' }}
                              />
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {cat.items.length} items · {catTotal} pts
                              </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                    Type:
                                    <select
                                      value={cat.type || 'numeric'}
                                      onChange={e => updateCategoryType(level, catIdx, e.target.value as any)}
                                      style={{ width: '80px', minHeight: '28px', fontSize: '11px', padding: '0 4px', background: 'transparent' }}
                                    >
                                      <option value="numeric">Numeric</option>
                                      <option value="text">Text</option>
                                      <option value="select">Select</option>
                                    </select>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                    Default pts:
                                    <input
                                      type="number" min={0} max={20} step={0.5}
                                      value={cat.max_score}
                                      onChange={e => updateCategoryDefault(level, catIdx, parseFloat(e.target.value) || 0)}
                                      title="Default max score for new items added to this category"
                                      style={{ width: '52px', minHeight: '28px', fontSize: '11px', textAlign: 'center' }}
                                    />
                                  </div>
                                </div>
                            <button
                              onClick={() => removeCategory(level, catIdx)}
                              style={{ background: '#fef2f2', border: 'none', minHeight: 'auto', padding: '6px', color: '#ef4444', borderRadius: '6px', marginLeft: '10px' }}
                              title="Remove category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Items table */}
                          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {cat.items.map((item, itemIdx) => (
                              <div key={itemIdx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px' }}>
                                {/* Item name */}
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={e => updateItemName(level, catIdx, itemIdx, e.target.value)}
                                  style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, minHeight: 'auto', padding: 0, boxShadow: 'none' }}
                                />
                                {/* Per-item max score */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                  <span>/</span>
                                  <input
                                    type="number" min={0.5} max={20} step={0.5}
                                    value={item.max_score}
                                    onChange={e => updateItemScore(level, catIdx, itemIdx, parseFloat(e.target.value) || 0.5)}
                                    style={{ width: '52px', minHeight: '28px', fontSize: '12px', textAlign: 'center' }}
                                    title="Max score for this item"
                                  />
                                </div>
                                {/* Remove button */}
                                <button
                                  onClick={() => removeItem(level, catIdx, itemIdx)}
                                  style={{ background: 'transparent', border: 'none', minHeight: 'auto', padding: '2px 4px', color: '#9ca3af' }}
                                  title="Remove item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}

                            <button
                              onClick={() => addItem(level, catIdx)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#eff6ff', border: '1px dashed #93c5fd', borderRadius: '8px', padding: '6px 12px', color: '#3b82f6', fontSize: '12px', fontWeight: 600, minHeight: 'auto', marginTop: '4px' }}
                            >
                              <Plus size={12} /> Add Item
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => addCategory(level)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f9fafb', border: '2px dashed #e5e7eb', color: '#6b7280', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                    >
                      <Plus size={16} /> Add Category
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {levelKeys.length === 0 && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          No scoring templates configured. Click "Add Level" to create your first template.
        </div>
      )}
    </div>
  );
}

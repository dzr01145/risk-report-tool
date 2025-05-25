import React, { useState } from 'react';

// 簡単な災害事例データ（例）
const disasterCases = [
  { title: "ボイラー点検中の漏電事故", description: "ボイラー点検中に漏電が発生し作業員が感電した事故です。" },
  { title: "湿気環境での感電死亡事故", description: "湿気の多い場所で絶縁不良が原因で作業員が感電し死亡した事故です。" },
  { title: "通電状態での作業中の感電", description: "電源を切らずに修理を行って感電、作業員が意識不明となった事故です。" },
  { title: "高所作業中の墜落事故", description: "足場の不備により作業者が高所から転落した事故です。" },
  { title: "電動工具の巻き込まれ事故", description: "電動工具使用中に衣服が巻き込まれて負傷した事故です。" },
];

export default function InputPanel() {
  const [hazard, setHazard] = useState('');
  const [risk, setRisk] = useState('');
  const [detailedReport, setDetailedReport] = useState('');

  // 類似度スコア計算して3件抽出
  const getTop3SimilarCases = () => {
    const keywords = `${hazard} ${risk}`.split(' ');
    const scored = disasterCases.map((c) => {
      const text = `${c.title} ${c.description}`;
      let score = 0;
      keywords.forEach(k => {
        if (text.includes(k)) score++;
      });
      return { ...c, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const handleDetailedReport = () => {
    const report = `【洗い出し内容】\n${hazard}\n\n【危険状況】\n${risk}\n\n【改善提案】\n◆ 本質安全: 設備の絶縁・防水強化\n◆ 作業手順: 電源遮断と作業許可制\n◆ 教育: 感電防止教育\n◆ 保護具: 絶縁用具の使用\n◆ 設備: 漏電ブレーカー設置\n◆ 点検: 定期的な電気系統点検の実施`;

    const legalRequirement = `【法的要求事項】\n安衛則 第333条「漏電による感電の危険を防止するため、漏電遮断装置を接続しなければならない」`;

    const similarCases = getTop3SimilarCases();
    const caseSummary = similarCases.map((c, idx) =>
      `${idx + 1}. ${c.title}（${c.description}）`
    ).join('\n');

    const fullReport = `${report}\n\n${legalRequirement}\n\n【関連災害事例】\n${caseSummary}`;
    setDetailedReport(fullReport);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2em auto',
      fontSize: '1.1em',
      textAlign: 'left',
      padding: '1em',
      boxSizing: 'border-box',
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 0 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center' }}>労災リスク詳細版レポートツール</h2>

      <label>洗い出し内容：</label><br />
      <input
        type="text"
        value={hazard}
        onChange={e => setHazard(e.target.value)}
        placeholder="例: はしご"
        style={{
          width: '100%',
          margin: '0.5em 0',
          padding: '0.5em',
          fontSize: '1.1em'
        }}
      /><br />

      <label>危険状況：</label><br />
      <input
        type="text"
        value={risk}
        onChange={e => setRisk(e.target.value)}
        placeholder="例: 墜落"
        style={{
          width: '100%',
          margin: '0.5em 0',
          padding: '0.5em',
          fontSize: '1.1em'
        }}
      /><br />

      <button
        onClick={handleDetailedReport}
        style={{
          margin: '1em 0',
          padding: '0.5em 1em',
          fontSize: '1.1em',
          background: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ④ 改善提案（詳細版）を生成
      </button>

      {detailedReport && (
        <pre style={{
          background: '#f9f9f9',
          padding: '1em',
          marginTop: '1em',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          color: '#333'
        }}>
          {detailedReport}
        </pre>
      )}
    </div>
  );
}

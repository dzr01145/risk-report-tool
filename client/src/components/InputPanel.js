import React, { useState } from 'react';

// 簡単な災害事例データ（例）
// 実際には必要に応じてファイルから読み込んでもOK
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
    const report = `【洗い出し内容】\n${hazard}\n\n【危険状況】\n${risk}\n\n【改善提案】\n・本質安全: 設備の絶縁・防水強化\n・作業手順: 電源遮断と作業許可制\n・教育: 感電防止教育\n・保護具: 絶縁用具の使用\n・設備: 漏電ブレーカー設置\n・点検: 定期的な電気系統点検の実施`;

    // 例として、安衛則 第333条 を表示
    const legalRequirement = `【法的要求事項】\n安衛則 第333条「漏電による感電の危険を防止するため、漏電遮断装置を接続しなければならない」`;

    const similarCases = getTop3SimilarCases();
    const caseSummary = similarCases.map((c, idx) =>
      `${idx + 1}. ${c.title}（${c.description}）`
    ).join('\n');

    const fullReport = `${report}\n\n${legalRequirement}\n\n【関連災害事例】\n${caseSummary}`;
    setDetailedReport(fullReport);
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', fontSize: '1.1em' }}>
      <h2>労災リスク詳細版レポートツール</h2>

      <label>洗い出し内容：</label><br />
      <input
        type="text"
        value={hazard}
        onChange={e => setHazard(e.target.value)}
        placeholder="例: ボイラー点検"
        style={{ width: '100%', margin: '0.3em 0', padding: '0.5em' }}
      /><br />

      <label>危険状況：</label><br />
      <input
        type="text"
        value={risk}
        onChange={e => setRisk(e.target.value)}
        placeholder="例: 感電"
        style={{ width: '100%', margin: '0.3em 0', padding: '0.5em' }}
      /><br />

      <button
        onClick={handleDetailedReport}
        style={{ margin: '1em 0', padding: '0.5em 1em' }}
      >
        ④ 改善提案（詳細版）を生成
      </button>

      {detailedReport && (
        <pre style={{
          background: '#f0f0f0',
          padding: '1em',
          marginTop: '1em',
          whiteSpace: 'pre-wrap'
        }}>
          {detailedReport}
        </pre>
      )}
    </div>
  );
}

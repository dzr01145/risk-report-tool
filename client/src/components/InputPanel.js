import React, { useState, useEffect, useRef } from 'react';

const hazards = ["フォークリフト", "コンベヤー", "プレス機", "足場", "ボイラー", "旋盤", "チェーンソー", "ブルドーザー", "クレーン車", "圧力容器", "電気設備", "階段・はしご道", "支保工", "作業床", "溝・ピット", "引火性の物", "可燃性のガス", "有害物質", "放射線", "環境要因(地面・床面)"];
const risks = ["墜落・転落", "はさまれ・巻き込まれ", "激突され", "飛来・落下", "崩壊・倒壊", "転倒", "切れ・こすれ", "踏み抜き", "おぼれ", "感電", "火災", "爆発", "破裂", "高温・低温との接触", "有害物等との接触", "交通事故（道路）", "交通事故（その他）", "動作の反動・無理な動作", "その他", "未分類"];

// 簡易版：キーワードに応じた法的条文情報
const legalArticles = [
  { keyword: "ボイラー", article: "労働安全衛生規則 第333条「漏電による感電の危険を防止するため、漏電遮断装置を接続しなければならない」" },
  { keyword: "はしご", article: "労働安全衛生規則 第518条「作業に使用するはしごは、必要な強度を有し、かつ安全に使用できるものでなければならない」" },
  // 必要に応じて他の条文情報も追加
];

export default function InputPanel() {
  const [hazard, setHazard] = useState('');
  const [risk, setRisk] = useState('');
  const [report, setReport] = useState('');
  const [detailedReport, setDetailedReport] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const recognitionRef = useRef(null);

  const exampleText = `【出力例】
① 洗い出し内容：
解体作業現場において、散乱した旧木材や壁材から露出した釘を踏み抜くリスクがあります。
② 危険状況：
歩行経路上に未除去の釘があり、作業者が安全靴を着用していても足底を貫通し、転倒や刺創事故を招くおそれがあります。
③ 改善提案：
敷地内の定期的な清掃と歩行ルートの明確化を徹底し、安全靴の点検・交換基準を強化します。`;

  const handleSubmit = async () => {
    const prompt = `あなたは日本の労働安全衛生の専門家です。
以下のキーワードをもとに、洗い出し内容と危険状況を必ず背景説明を含めて文章化してください。
出力は以下の例文を参考にし、同様のトーン・構成・具体性で作成してください。
語尾は「〜です」「〜ます」調にしてください。

${exampleText}

【キーワード】
洗い出し内容: ${hazard}
危険状況: ${risk}`;

    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hazard, risk, prompt })
    });
    const data = await response.json();
    setReport(data.result);
    setDetailedReport('');
  };

  const handleDetailedReport = async () => {
    const prompt = `あなたは日本の労働安全衛生の専門家です。
以下のキーワードをもとに、洗い出し内容・危険状況を背景説明を含めて200文字程度で詳細に文章化し、その後に改善提案をカテゴリごとに200文字程度でまとめてください。
最後に必ず関連する災害事例を3件、簡潔な文章でまとめて載せてください。
出力には法令のURLを一切載せないようにしてください。
語尾は「〜です」「〜ます」調にしてください。

【キーワード】
洗い出し内容: ${hazard}
危険状況: ${risk}`;

    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hazard, risk, prompt })
    });
    const data = await response.json();

    // 条文情報をキーワードに応じて自動付加
    const matchedArticle = legalArticles.find(a => hazard.includes(a.keyword) || risk.includes(a.keyword));
    const legalRequirement = matchedArticle ? `【法的要求事項】\n${matchedArticle.article}` : '';

    const fullReport = `${data.result}\n\n${legalRequirement}`;
    setDetailedReport(fullReport);
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
  }, []);

  const handleVoiceInput = (type) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.start();
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        recognition.stop();
        recognition.start();
      } else {
        console.error("音声認識エラー:", error);
      }
    }
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscriptText(`認識結果（${type === 'hazard' ? '洗い出し' : '危険状況'}）：${transcript}`);
      if (type === 'hazard') setHazard(transcript);
      if (type === 'risk') setRisk(transcript);
    };
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: 'auto', fontSize: '1.1em' }}>
      <h2 style={{ fontSize: '1.4em', marginBottom: '1em' }}>労災リスク詳細版レポートツール</h2>

      <div style={{ marginBottom: '1em' }}>
        <label>洗い出し内容：</label><br />
        <input
          type="text"
          value={hazard}
          onChange={e => setHazard(e.target.value)}
          placeholder="直接入力または選択"
          style={{ width: '80%', margin: '0.3em 0', fontSize: '1.1em', padding: '0.5em' }}
        /><br />
        <select
          value={hazard}
          onChange={e => setHazard(e.target.value)}
          style={{ width: '80%', margin: '0.3em 0', fontSize: '1.1em', padding: '0.5em' }}
        >
          <option value="">選択してください</option>
          {hazards.map(h => <option key={h} value={h}>{h}</option>)}
        </select><br />
        <button
          onClick={() => handleVoiceInput('hazard')}
          style={{ margin: '0.3em', fontSize: '1.1em', padding: '0.5em 1em' }}
        >🎤 話す</button>
      </div>

      <div style={{ marginBottom: '1em' }}>
        <label>危険状況：</label><br />
        <input
          type="text"
          value={risk}
          onChange={e => setRisk(e.target.value)}
          placeholder="直接入力または選択"
          style={{ width: '80%', margin: '0.3em 0', fontSize: '1.1em', padding: '0.5em' }}
        /><br />
        <select
          value={risk}
          onChange={e => setRisk(e.target.value)}
          style={{ width: '80%', margin: '0.3em 0', fontSize: '1.1em', padding: '0.5em' }}
        >
          <option value="">選択してください</option>
          {risks.map(r => <option key={r} value={r}>{r}</option>)}
        </select><br />
        <button
          onClick={() => handleVoiceInput('risk')}
          style={{ margin: '0.3em', fontSize: '1.1em', padding: '0.5em 1em' }}
        >🎤 話す</button>
      </div>

      <button
        onClick={handleSubmit}
        style={{ margin: '1em', fontSize: '1.1em', padding: '0.5em 1em' }}
      >報告書を作成する</button><br />

      {report && (
        <>
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f0f0f0', padding: '1em', borderRadius: '8px', margin: '1em 0', fontSize: '1.2em' }}>{report}</pre>
          <button
            onClick={handleDetailedReport}
            style={{ margin: '1em', fontSize: '1.1em', padding: '0.5em 1em' }}
          >④ 改善提案（詳細版）</button>
        </>
      )}

      {detailedReport && (
        <pre style={{ whiteSpace: 'pre-wrap', color: 'darkblue', textAlign: 'left', background: '#f0f0f0', padding: '1em', borderRadius: '8px', margin: '1em 0', fontSize: '1.2em' }}>
          {detailedReport}
        </pre>
      )}

      {transcriptText && <p>{transcriptText}</p>}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';

const hazards = ["フォークリフト", "コンベヤー", "プレス機", "足場", "ボイラー", "旋盤", "チェーンソー", "ブルドーザー", "クレーン車", "圧力容器", "電気設備", "階段・はしご道", "支保工", "作業床", "溝・ピット", "引火性の物", "可燃性のガス", "有害物質", "放射線", "環境要因(地面・床面)"];
const risks = ["墜落・転落", "はさまれ・巻き込まれ", "激突され", "飛来・落下", "崩壊・倒壊", "転倒", "切れ・こすれ", "踏み抜き", "おぼれ", "感電", "火災", "爆発", "破裂", "高温・低温との接触", "有害物等との接触", "交通事故（道路）", "交通事故（その他）", "動作の反動・無理な動作", "その他", "未分類"];

export default function InputPanel() {
  const [hazard, setHazard] = useState('');
  const [risk, setRisk] = useState('');
  const [report, setReport] = useState('');
  const [detailedReport, setDetailedReport] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const recognitionRef = useRef(null);

  const handleSubmit = async () => {
    const prompt = `あなたは日本の労働安全衛生の専門家です。  
以下の「洗い出し内容」と「危険状況」をもとに、現場の背景説明を含めて危険性を文章化し、簡単な改善提案をまとめてください。  
語尾は「〜です」「〜ます」調にしてください。

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
以下の「洗い出し内容」と「危険状況」をもとに、背景説明を含めて危険性を文章化し、さらに詳細な改善提案をまとめてください。  
語尾は「〜です」「〜ます」調にしてください。

洗い出し内容: ${hazard}
危険状況: ${risk}`;

    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hazard, risk, prompt })
    });
    const data = await response.json();
    setDetailedReport(data.result);
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
    <div>
      <h2>労災リスク報告書ツール（シンプル版）</h2>
      <label>洗い出し内容：</label><br />
      <input type="text" value={hazard} onChange={e => setHazard(e.target.value)} placeholder="直接入力または選択" />
      <select value={hazard} onChange={e => setHazard(e.target.value)}>
        <option value="">選択してください</option>
        {hazards.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <button onClick={() => handleVoiceInput('hazard')}>🎤 話す</button>
      <br /><br />

      <label>危険状況：</label><br />
      <input type="text" value={risk} onChange={e => setRisk(e.target.value)} placeholder="直接入力または選択" />
      <select value={risk} onChange={e => setRisk(e.target.value)}>
        <option value="">選択してください</option>
        {risks.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <button onClick={() => handleVoiceInput('risk')}>🎤 話す</button>
      <br /><br />

      <button onClick={handleSubmit}>報告書を作成する</button><br /><br />

      {report && (
        <>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{report}</pre>
          <button onClick={handleDetailedReport}>④ 改善提案（詳細版）</button>
        </>
      )}
      {detailedReport && <pre style={{ whiteSpace: 'pre-wrap', color: 'darkblue' }}>{detailedReport}</pre>}
      {transcriptText && <p>{transcriptText}</p>}
    </div>
  );
}

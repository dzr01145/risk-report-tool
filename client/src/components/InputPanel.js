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
    const prompt = `あなたは日本の労働安全衛生の専門家です。入力されたキーワードをもとに、予見しうる労働災害を踏まえた「洗い出し内容」と「危険状況」を具体的に想定・文章化し、簡単な改善提案をまとめてください。語尾は「〜です」「〜ます」調にしてください。 ${hazard}を踏まえて洗い出し内容を表記、${risk}を踏まえて危険状況を表記　それぞれ150文字`;

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
    const prompt = `あなたは日本の労働安全衛生の専門家です。入力されたキーワードをもとに、予見しうる労働災害を踏まえた「洗い出し内容」と「危険状況」を具体的に想定・文章化し、詳細な改善提案をまとめてください。語尾は「〜です」「〜ます」調にしてください。 ${hazard}を踏まえて洗い出し内容を詳細に表記、${risk}を踏まえて危険状況を詳細に表記　それぞれ300文字`;

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
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: 'auto', fontSize: '1.1em' }}>
      <h2 style={{ fontSize: '1.4em', marginBottom: '1em' }}>労災リスク報告書ツール（UTF-8版）</h2>

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
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f0f0f0', padding: '1em', borderRadius: '8px', margin: '1em 0' }}>{report}</pre>
          <button
            onClick={handleDetailedReport}
            style={{ margin: '1em', fontSize: '1.1em', padding: '0.5em 1em' }}
          >④ 改善提案（詳細版）</button>
        </>
      )}

      {detailedReport && (
        <pre style={{ whiteSpace: 'pre-wrap', color: 'darkblue', textAlign: 'left', background: '#f0f0f0', padding: '1em', borderRadius: '8px', margin: '1em 0' }}>
          {detailedReport}
        </pre>
      )}

      {transcriptText && <p>{transcriptText}</p>}
    </div>
  );
}

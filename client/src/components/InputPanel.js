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
以下のキーワードをもとに、洗い出し内容・危険状況を必ず背景説明を含めて200文字程度で詳細に文章化し、その後に改善提案をカテゴリごとに200文字程度でまとめてください。
特に「法令要求事項」の部分では、以下のe-Gov法令検索URLを根拠に、各項目に該当する条項の内容（1件100文字程度）を必ず具体的に引用・説明してください。
語尾は「〜です」「〜ます」調にしてください。

【e-Gov法令検索URL】
1. 労働安全衛生法：https://elaws.e-gov.go.jp/document?lawid=347AC0000000057
2. 労働安全衛生法施行令：https://elaws.e-gov.go.jp/document?lawid=347CO0000000318
3. 労働安全衛生規則：https://elaws.e-gov.go.jp/document?lawid=347M50000080032
4. 特定化学物質障害予防規則：https://elaws.e-gov.go.jp/document?lawid=353M50000080039
5. 有機溶剤中毒予防規則：https://elaws.e-gov.go.jp/document?lawid=347M50000080036
6. 鉛中毒予防規則：https://elaws.e-gov.go.jp/document?lawid=347M50000080035
7. 石綿障害予防規則：https://elaws.e-gov.go.jp/document?lawid=417M60000080021
8. 酸素欠乏症等防止規則：https://elaws.e-gov.go.jp/document?lawid=347M50000080033
9. 電離放射線障害防止規則：https://elaws.e-gov.go.jp/document?lawid=347M50000080041
10. 事務所衛生基準規則：https://elaws.e-gov.go.jp/document?lawid=347M50000080043

【キーワード】
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
    <div style={{ textAlign: 'center', maxWidth: '500px', margin: 'auto', fontSize: '1.1em' }}>
      <h2 style={{ fontSize: '1.4em', marginBottom: '1em' }}>労災リスク報告書ツール（例文指示・法令根拠版）</h2>
      {/* 以下のUIはそのまま */}
      {/* ...省略 */}
    </div>
  );
}

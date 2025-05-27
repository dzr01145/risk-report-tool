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

  const fetchLawArticle = async (lawNum, articleNum) => {
    const numericArticle = articleNum.replace(/[^0-9]/g, '');
    const url = `/api/law/${lawNum}/${numericArticle}`; // バックエンド経由

    console.log("APIリクエストURL:", url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
        const errorBody = await response.text();
        console.error("Error Response Body:", errorBody);
        return "法令情報の取得に失敗しました (HTTPエラー)";
      }

      const xmlText = await response.text();
      console.log("APIレスポンス:", xmlText);

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error("XML parsing error:", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
        return "法令情報の解析に失敗しました (XML解析エラー)";
      }

      let lawContents = xmlDoc.getElementsByTagName("LawContents")[0]?.textContent;
      if (!lawContents) {
        const article = xmlDoc.getElementsByTagName("Article")[0];
        lawContents = article?.textContent;
      }

      return lawContents || "該当条文が見つかりませんでした";
    } catch (error) {
      console.error("Error during e-Gov API call:", error);
      return "法令情報の取得中に予期せぬエラーが発生しました";
    }
  };

  const exampleText = `【出力例】
① 洗い出し内容：
解体作業現場において、散乱した旧木材や壁材から露出した状況が見られます。そのため、作業者が◎◯の危険源に近接する機会が多くなっています。
② 危険状況：
歩行経路上に未除去の釘があり、作業者の不注意などの要因から安全靴を着用していても足底を貫通し、転倒や刺創事故を招くおそれがあります。
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
    const lawNum = "347AC0000000057";
    const articleNums = ["第28条", "第59条", "第100条"];
    const lawArticles = [];

    for (const articleNum of articleNums) {
      const text = await fetchLawArticle(lawNum, articleNum);
      if (text && text !== "該当条文が見つかりませんでした") {
        lawArticles.push(`・労働安全衛生法${articleNum}: ${text}`);
        if (lawArticles.length >= 3) break;
      }
    }

    const lawTextBlock = lawArticles.length > 0
      ? `① 法的要求事項の遵守\n${lawArticles.join("\n")}`
      : "① 法的要求事項の遵守\n※該当条文の取得結果がありませんでした";

    const prompt = `あなたは日本の労働安全衛生の専門家です。
以下のキーワードでタイトルを表示するとともに、関連する内容を背景説明を含めて200文字程度で要点をまとめつつわかりやすく文章化してください。

なお、法的要求事項は、前段の洗い出し内容と危険状況を必ず背景説明を踏まえ、条文番号とその内容を最大3件、省略せずに条文そのまま引用してください。

語尾は「〜です」「〜ます」調にしてください。

最後に必ず洗い出し内容と危険状況に関連する災害事例を3件、タイトルと簡潔な文章で番号付きでまとめて載せてください。

【キーワード】
・洗い出し内容: ${hazard}
・危険状況: ${risk}
・法的要求事項の遵守:${lawTextBlock}

［改善提案詳細］
(1) 洗い出し内容：（300文字程度）
(2) 危険状況：（300文字程度）
(3) 改善提案：
① 法的要求事項の遵守（取得できたもののみ引用してください）
② 本質的対策（300文字程度）
③ 工学的対策（300文字程度）
④ 管理的対策（300文字程度）
⑤ 保護具の使用（300文字程度）`;

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
      <h2 style={{ fontSize: '1.4em', marginBottom: '1em' }}>労働災害リスクファインダー</h2>

      <div style={{ marginBottom: '1em' }}>
        <label style={{ fontWeight: 'bold', fontSize: '1.2em' }}>【洗い出し内容】</label><br />
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
        <button onClick={() => handleVoiceInput('hazard')} style={{ margin: '0.3em', fontSize: '1.1em', padding: '0.5em 1em' }}>🎤 話す</button>
      </div>

      <div style={{ marginBottom: '1em' }}>
        <label style={{ fontWeight: 'bold', fontSize: '1.2em' }}>【危険状況】</label><br />
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
        <button onClick={() => handleVoiceInput('risk')} style={{ margin: '0.3em', fontSize: '1.1em', padding: '0.5em 1em' }}>🎤 話す</button>
      </div>

      <button onClick={handleSubmit} style={{ margin: '1em', fontSize: '1.1em', padding: '0.5em 1em' }}>報告書を作成する</button><br />

      {report && (
        <>
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f0f0f0', padding: '1em', borderRadius: '8px', margin: '1em 0', fontSize: '1.375em' }}>{report}</pre>
          <button onClick={handleDetailedReport} style={{ margin: '1em', fontSize: '1.1em', padding: '0.5em 1em' }}>④ 改善提案（詳細版）</button>
        </>
      )}

      {detailedReport && (
        <pre style={{ whiteSpace: 'pre-wrap', color: 'darkblue', textAlign: 'left', background: '#f0f0f0', padding: '1em', borderRadius: '8px', margin: '1em 0', fontSize: '1.375em' }}>
          {detailedReport}
        </pre>
      )}

      {transcriptText && <p>{transcriptText}</p>}
    </div>
  );
}

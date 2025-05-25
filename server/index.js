require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ▼▼ 仮のデータ（例：テストデータ） ▼▼
let disasterData = [
  { 発生状況: "コンベアで巻き込まれた", 原因: "安全装置がなかった", 対策: "安全柵の設置", "災害の種類(事故の型)": "はさまれ・巻き込まれ" },
  { 発生状況: "高所から転落", 原因: "安全帯を着用していなかった", 対策: "安全帯の使用", "災害の種類(事故の型)": "墜落・転落" }
];
console.log('✅ 仮の災害事例データを使用');

// ▼ 法的要求事項（例） ▼
const law = {
  article: "労働安全衛生法（概略）",
  content: "労働者の安全を確保するため、事業者は必要な措置を講じる義務があります。"
};

// ▼ APIエンドポイント ▼
app.post('/api/report', async (req, res) => {
  const { hazard, risk, prompt } = req.body;

  // 関連事例抽出（最大5件）
  const matchedCases = disasterData.filter(d =>
    (d['発生状況'] && d['発生状況'].includes(hazard)) ||
    (d['災害の種類(事故の型)'] && d['災害の種類(事故の型)'].includes(risk))
  ).slice(0, 5);

  const relatedCasesSummary = matchedCases.map((d, i) =>
    `【事例${i + 1}】${d['発生状況']} / 原因: ${d['原因']} / 対策: ${d['対策']}`
  ).join('\n');

  // finalPromptはフロントエンドから送られてきたpromptをそのまま使用
  const finalPrompt = prompt;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: finalPrompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0].message) {
      res.json({ result: data.choices[0].message.content.trim() });
    } else {
      console.error('⚠️ OpenAI API response error:', data);
      res.status(500).json({ error: "OpenAI API response error", details: data });
    }
  } catch (error) {
    console.error('⚠️ API call failed:', error);
    res.status(500).json({ error: "API call failed", details: error });
  }
});

// ▼ Reactアプリのビルド成果物を返す部分（正しいパス！） ▼
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT} (UTF-8簡易版)`);
});

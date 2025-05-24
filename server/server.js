// server.js（Render対応版・UTF-8完全版）

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csvParser = require('csv-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000; // Render環境向けにPORTを動的に取得

app.use(cors());
app.use(express.json());

// 災害事例データベース読み込み
let disasterData = [];
fs.createReadStream('./data/災害事例データベース.csv', { encoding: 'utf-8' })
  .pipe(csvParser())
  .on('data', (row) => {
    disasterData.push(row);
  })
  .on('end', () => {
    console.log('✅ 災害事例データベース読み込み完了。件数:', disasterData.length);
  });

// 法令データ例（必要に応じて拡充可能）
const LAW_ARTICLES = {
  "コンベヤー": {
    article: "労働安全衛生法第20条",
    content: "事業者は労働者の安全を確保しなければならない。"
  },
  "足場": {
    article: "労働安全衛生法第21条",
    content: "事業者は足場の安全性を確保しなければならない。"
  }
};

app.post('/api/report', async (req, res) => {
  const { hazard, risk, detailed } = req.body;

  // 関連事例データベースから情報抽出（例：最大5件）
  const matchedCases = disasterData.filter(d =>
    (d['発生状況'] && d['発生状況'].includes(hazard)) ||
    (d['災害の種類(事故の型)'] && d['災害の種類(事故の型)'].includes(risk))
  ).slice(0, 5);

  const relatedCasesSummary = matchedCases.map((d, i) =>
    `【事例${i + 1}】${d['発生状況']} / 原因: ${d['原因']} / 対策: ${d['対策']}`
  ).join('\n');

  // 法令情報
  const law = LAW_ARTICLES[hazard] || { article: "なし", content: "関連情報なし" };

  // プロンプト生成
  const finalPrompt = `
あなたは日本の労働安全衛生の専門家です。
以下の【基本情報】および【関連災害事例】を踏まえ、${detailed ? "【300文字程度ずつ】" : "【150文字程度ずつ】"}で生成してください。
最初に必ず【法的要求事項】として、該当する労働安全衛生法令の条文番号と内容を明記し、その後に以下3点を順に記述してください。

【基本情報】
洗い出し内容：「${hazard}」
危険状況：「${risk}」

【関連災害事例】
${relatedCasesSummary || "関連事例情報なし"}

【法的要求事項】
${law.article}: ${law.content}

出力フォーマット：
① 洗い出し内容：
② 危険状況：
③ 改善提案：（優先順位：法令順守、本質安全、工学的、管理的、保護具の順。「〜をお勧めします」「〜が望まれます」で締めてください）

全て比較的フォーマルな口語体（「〜です」「〜ます」調）で出力してください。
`;

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

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT} (UTF-8完全版)`);
});

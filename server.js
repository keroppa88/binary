const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 和文モールス符号テーブル（カタカナ → モールス）
const WABUN_TABLE = {
  'ア': '--・--', 'イ': '・-', 'ウ': '・・-', 'エ': '-・---', 'オ': '・-・・・',
  'カ': '・-・・', 'キ': '-・-・・', 'ク': '・・・-', 'ケ': '-・--', 'コ': '----',
  'サ': '-・-・-', 'シ': '--・-・', 'ス': '---・-', 'セ': '・---・', 'ソ': '---・',
  'タ': '-・', 'チ': '・・-・', 'ツ': '・--・', 'テ': '・-・--', 'ト': '・・-・・',
  'ナ': '・-・', 'ニ': '-・・-', 'ヌ': '・・・・', 'ネ': '--・-', 'ノ': '・・--',
  'ハ': '-・・・', 'ヒ': '--・・-', 'フ': '--・・', 'ヘ': '・', 'ホ': '-・・',
  'マ': '-・・-・', 'ミ': '・・-・-', 'ム': '-', 'メ': '-・・・-', 'モ': '-・・-',
  'ヤ': '・--', 'ユ': '-・・--', 'ヨ': '--',
  'ラ': '・・・', 'リ': '--・', 'ル': '-・--・', 'レ': '---', 'ロ': '・-・-',
  'ワ': '-・-', 'ヲ': '・---', 'ン': '・-・-・',
  'ァ': '・-・・・・', 'ィ': '・・-', 'ゥ': '・・-', 'ェ': '-・---・', 'ォ': '・-・・・',
  'ッ': '・--・', 'ャ': '・--', 'ュ': '-・・--', 'ョ': '--',
  '゛': '・・', '゜': '・・--・',
  '。': '・-・-・-', '、': '・-・-・', '「': '・-・・-・', '」': '・-・・-・',
  'ー': '・--・-', '（': '-・--・-', '）': '・-・・--'
};

// カタカナ → 和文モールス変換
function katakanaToWabunMorse(text) {
  const result = [];
  for (const ch of text) {
    if (WABUN_TABLE[ch]) {
      result.push(WABUN_TABLE[ch]);
    }
  }
  return result.join(' ');
}

// Gemini APIを使ってテキストをカタカナに変換
async function convertToKatakana(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `以下のテキストをカタカナに変換してください。カタカナのみを出力し、それ以外の文字（漢字、ひらがな、英数字など）はすべてカタカナに変換してください。変換結果のみを出力してください。

テキスト: ${text}`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// Gemini APIを使ってテキストをヘボン式ローマ字に変換
async function convertToRomaji(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `以下の日本語テキストをヘボン式ローマ字（Hepburn romanization）に変換してください。ローマ字のみを出力してください。

テキスト: ${text}`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// POST /api/convert
// body: { text: string, type: 'katakana' | 'romaji' | 'morse_kana' }
// response: { result: string, morse?: string }
app.post('/api/convert', async (req, res) => {
  const { text, type } = req.body;

  if (!text || !type) {
    return res.status(400).json({ error: 'text と type は必須です' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY が設定されていません' });
  }

  try {
    if (type === 'katakana') {
      const katakana = await convertToKatakana(text);
      return res.json({ result: katakana });
    }

    if (type === 'romaji') {
      const romaji = await convertToRomaji(text);
      return res.json({ result: romaji });
    }

    if (type === 'morse_kana') {
      const katakana = await convertToKatakana(text);
      const morse = katakanaToWabunMorse(katakana);
      return res.json({ result: katakana, morse });
    }

    return res.status(400).json({ error: '無効な type です。katakana / romaji / morse_kana を指定してください' });
  } catch (err) {
    console.error('Gemini API エラー:', err);
    return res.status(500).json({ error: 'Gemini API の呼び出しに失敗しました: ' + err.message });
  }
});

// GET / → index.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});

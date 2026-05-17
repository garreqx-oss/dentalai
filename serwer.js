import express from "express";
import multer from "multer";
import cors from "cors";
import axios from "axios";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// -----------------------
// KONFIGURACJA
// -----------------------
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 10000;

const upload = multer({ dest: "uploads/" });

// -----------------------
// 1) TRANSKRYPCJA AUDIO
// -----------------------
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Brak pliku audio" });

  try {
    const audioStream = fs.createReadStream(req.file.path);

    const response = await axios.post(
      "[api.openai.com](https://api.openai.com/v1/audio/transcriptions)",
      audioStream,
      {
        headers: {
          "Content-Type": "audio/m4a",
          Authorization: `Bearer ${OPENAI_KEY}`
        },
        params: {
          model: "whisper-1",
          language: "pl",
          response_format: "text"
        }
      }
    );

    fs.unlinkSync(req.file.path);
    res.json({ text: response.data });

  } catch (err) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Błąd transkrypcji", details: err.message });
  }
});

// -----------------------
// 2) GENEROWANIE OPISU WIZYTY
// -----------------------
app.post("/summarize", async (req, res) => {
  const { transcription } = req.body;
  if (!transcription)
    return res.status(400).json({ error: "Brak transkrypcji" });

  try {
    const response = await axios.post(
      "[api.openai.com](https://api.openai.com/v1/chat/completions)",
      {
        model: "gpt-4o",
        temperature: 0.3,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content:
              "Jesteś asystentem medycznym. Stwórz profesjonalny opis wizyty dentystycznej na podstawie transkrypcji."
          },
          {
            role: "user",
            content: transcription
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ summary: response.data.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: "Błąd generowania opisu", details: err.message });
  }
});

// -----------------------

app.listen(PORT, () => {
  console.log(`Dental AI proxy running on port ${PORT}`);
});

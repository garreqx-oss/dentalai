# DentalAI – Proxy backend for Android app

Endpoints:
POST /transcribe  – accepts audio file, returns transcription (pl)
POST /summarize   – accepts transcribed text, returns visit summary

Environment variables:
OPENAI_API_KEY=your_key_here

Deploy on Render.com:
- create new web service
- connect repo
- Render will auto-detect Node

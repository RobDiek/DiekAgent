# DiekAI Workbench

A full-featured AI productivity platform built with React, TypeScript, Vite, Tailwind CSS, Supabase, and OpenAI-compatible APIs.

## Features

| Module | Description |
|---|---|
| AI Chat | Streaming chat with conversation history, model selector |
| Research Agent | Structured AI reports: summary, findings, pros/cons, risks |
| Document Generator | Generate blogs, emails, proposals, technical docs |
| Presentation Generator | Slide decks with speaker notes, JSON export |
| File Analysis | Upload TXT/CSV (parsed), PDF/DOCX (placeholder), AI Q&A |
| Agent Builder | Custom AI agents with system prompts and tools |
| Task Center | Unified task monitoring with filters |
| Settings | Profile, AI API config, appearance, usage metrics |

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
npm run dev
```

## Database

Run `supabase/schema.sql` in your Supabase SQL editor to create all tables with RLS.

## Tech Stack

React 18 + TypeScript + Vite + Tailwind CSS v3 + Supabase + OpenAI API

Built by DiekerIT

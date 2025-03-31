# RecipeBase

A modern web application for managing and sharing recipes, featuring AI-powered functions to assist you in the kitchen.

## Features

- Create and manage recipes
- AI-powered chat assistant for cooking tips and recipe suggestions
- Search functionality to find recipes
- Built-in kitchen timer
- Responsive design for all devices

## Tech Stack

- Vue 3 with TypeScript
- Pinia for state management
- Supabase for database and authentication
- Google Gemini AI for chat functionality
- Tailwind CSS for styling

## Installation

1. Clone the repo:

```bash
git clone https://github.com/your-username/recipe-base.git
cd recipe-base
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and add the following environment variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
DATABASE_PASSWORD=your-database-password

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key

# Hugging Face Configuration
VITE_HF_ACCESS_TOKEN=your-huggingface-token
```

4. Start the development server:

```bash
npm run dev
```

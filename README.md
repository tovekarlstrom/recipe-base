# RecipeBase

A modern web application for managing and sharing recipes, featuring AI-powered functions to assist you in the kitchen. Built with a focus on user experience and smart recipe management.

## Features

- 🍳 **Recipe Management**

  - Create, read, and delete recipes
  - Categorize recipes automatically using AI
  - Store ingredients with amounts and units
  - Step-by-step cooking instructions
  - Portion size management

- **AI Assistant (Gramz)**

  - Smart chat interface for cooking assistance
  - Recipe suggestions based on preferences
  - Cooking tips and techniques
  - Ingredient substitutions
  - Personalized recommendations

- **Smart Search**

  - Semantic search for recipes
  - Filter by categories
  - Search by ingredients
  - Swedish language support with word variations

- **Kitchen Tools**

  - Built-in kitchen timer
  - Recipe scaling
  - Equipment requirements

- **User Features**
  - Recipe collection
  - Dietary preferences and restrictions
  - Cooking experience level adaptation
  - Equipment availability tracking

## Tech Stack

- **Tech Stack**

  - Vue 3 with TypeScript
  - Pinia for state management
  - Tailwind CSS for styling
  - Vite for build tooling
  - Supabase for database and authentication
  - OpenAI GPT-4 for AI chat functionality
  - OpenAI embeddings for semantic search

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/tovekarlstrom/recipe-base.git
cd recipe-base
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
DATABASE_PASSWORD=your-database-password

# OpenAI Configuration
VITE_OPENAI_API_KEY=your-openai-api-key
```

4. Start the development server:

```bash
npm run dev
```

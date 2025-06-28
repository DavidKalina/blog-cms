# Blog CMS

A modern blog content management system built with React, TypeScript, and Supabase.

## Features

- **Drag & Drop Markdown Upload**: Upload local markdown files with frontmatter support
- **Real-time Editor**: Rich text editor with markdown support
- **Article Management**: Create, edit, and publish articles
- **Tag System**: Organize articles with tags
- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works on desktop and mobile

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account and project

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd blog-cms
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:

```bash
npm run dev
```

## Using the Drag & Drop Uploader

The new drag-and-drop uploader allows you to quickly import markdown files from your local system:

1. Navigate to the dashboard and click "Upload Files"
2. Drag and drop your `.md` or `.markdown` files onto the upload area
3. The system will automatically parse frontmatter and extract metadata
4. Click "Save" on individual files or "Save All" to process them all
5. Files are automatically converted to articles in your database

### Supported Frontmatter

Your markdown files can include frontmatter with the following fields:

```yaml
---
title: "Your Article Title"
excerpt: "A brief description of your article"
category: "Technology"
date: "2024-01-01"
tags: ["javascript", "react", "tutorial"]
---
# Your Article Content

Your markdown content goes here...
```

### Edge Function

The uploader uses a Supabase Edge Function (`process-markdown`) to handle file processing. To deploy it:

```bash
supabase functions deploy process-markdown
```

## Database Schema

The system uses the following tables:

- `articles`: Main article content and metadata
- `tags`: Article tags
- `article_tags`: Many-to-many relationship between articles and tags

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/                # Utility functions and config
└── supabase/
    └── functions/      # Edge functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

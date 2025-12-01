# notmat

A full-stack application that transforms unstructured plain-text notes into hierarchical, task-based structures with AI-powered parsing, metadata extraction, and multi-format exports.

## 🚀 Features

- **AI-Powered Transformation**: Convert chaotic notes (up to 2000 words) into structured, hierarchical task lists
- **Intelligent Parsing**: Automatic detection of tasks, priorities, dates, and tags
- **Multi-Format Export**: Export to Markdown, HTML, and plain text
- **Revision History**: Track all note versions with unique revision IDs
- **Smart Caching**: Cache AI responses for identical inputs
- **In-Memory Storage**: Fast, lightweight data management without database dependencies
- **Responsive UI**: Modern TailwindCSS interface with real-time progress tracking

## 📋 Tech Stack

### Frontend

- **Next.js 14+** with App Router
- **TypeScript** (strict mode)
- **TailwindCSS** for styling
- **Zustand** for state management
- **Axios** for API calls

### Backend

- **Express** with TypeScript
- **In-Memory Storage** with JavaScript Maps
- **Google Gemini API** for AI transformations (free tier)
- **Winston** for structured logging
- **Zod** for validation

### Infrastructure

- **Node.js/Bun** runtime
- **GitHub Actions** for CI/CD
- **Playwright** for E2E testing

## 🏗️ Repository Structure

```
/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/
│   │   │   ├── lib/      # API client
│   │   │   ├── services/
│   │   │   ├── store/    # Zustand stores
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── api/              # Express backend
│       ├── src/
│       │   ├── controllers/
│       │   ├── storage/  # In-memory storage
│       │   ├── middleware/
│       │   ├── routers/
│       │   ├── services/
│       │   ├── types/
│       │   └── utils/
│       └── package.json
│
├── tests/
│   └── note-automation.spec.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── package.json
└── README.md
```

## 🔧 Prerequisites

- **Bun**: 1.0.0 or higher ([Install Bun](https://bun.sh)) OR **Node.js**: 18.0.0 or higher
- **Google Gemini API Key**: Free tier available (1M tokens/day) - [Get your free key](https://makersuite.google.com/app/apikey)

## 🚦 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd phy
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Google Gemini API (FREE - 1M tokens/day)
# Get your free key at: https://makersuite.google.com/app/apikey
# REQUIRED: Application will not start without this key
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY_HERE

# API
API_URL=http://localhost:4000
APP_URL=http://localhost:3000

# AI Model
MODEL_NAME=gemini-1.5-pro
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000

# Logging
LOG_LEVEL=info

# Cache
CACHE_TTL_HOURS=24
```

### 4. Start Development Servers

Start both frontend and backend:

```bash
bun dev
```

Or start them separately:

```bash
# Terminal 1 - Frontend
bun run dev:web

# Terminal 2 - Backend
bun run dev:api
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 🧪 Testing

### Run All Tests

```bash
bun test
```

### Run E2E Tests

```bash
bun run test:e2e
```

### Run Backend Unit Tests

```bash
bun --filter @note-automation/api test
```

## 🎯 Usage Guide

### Create a Note

1. Navigate to http://localhost:3000
2. Click "Create New Note"
3. Enter your unstructured notes (up to 2000 words)
4. Configure options:
   - **Tone**: Original, Formal, Casual, Professional
   - **Formatting Strictness**: Loose, Moderate, Strict
   - **Export Mode**: All formats, Markdown, HTML, or Text
   - **Use Cached**: Enable to reuse previous results
5. Click "Submit Note"

### View Results

- The system processes your note with AI
- Progress is displayed in real-time
- Once complete, view the hierarchical structure with:
  - Extracted tasks and subtasks
  - Metadata (tags, dates, priorities)
  - Ambiguous segments (highlighted)
  - Contradictions (if any)

### Export Notes

- Click export buttons for Markdown, HTML, or Plain Text
- Files download automatically

### Settings

- Configure default options for new notes
- Adjust AI model settings
- Enable/disable caching

## 📝 API Endpoints

### Notes

- `POST /api/v1/notes` - Create new note
- `GET /api/v1/notes/:revisionId/status` - Get processing status
- `GET /api/v1/notes/:revisionId/result` - Get parsed result
- `GET /api/v1/notes/:revisionId/export?format=markdown|html|text` - Export note
- `GET /api/v1/notes` - List all notes

### Cache

- `POST /api/v1/cache/invalidate` - Invalidate all caches

### Health

- `GET /health` - Health check endpoint

## 🔍 AI Transformation Details

The system uses a sophisticated prompt to transform notes:

### Input

- Raw plain-text (up to 2000 words)
- Possibly multilingual and chaotic

### Output Structure

```json
{
  "meta": {
    "revisionId": "uuid",
    "detectedLanguage": "en",
    "topTags": ["tag1", "tag2"],
    "dates": ["tomorrow", "next week"],
    "priorities": ["high", "medium"]
  },
  "structure": [
    {
      "id": "s1",
      "title": "Section Title",
      "content": "Section content",
      "tasks": [
        {
          "id": "t1",
          "text": "Task description",
          "granularity": "broad|fine",
          "steps": ["step1", "step2"],
          "priority": "high",
          "dependencies": ["t2"]
        }
      ],
      "children": []
    }
  ],
  "ambiguousSegments": [],
  "contradictions": [],
  "exports": {
    "markdown": "...",
    "html": "...",
    "plainText": "..."
  }
}
```

### Processing Rules

1. **Grouping**: Task-based semantic grouping
2. **Hierarchy**: Variable-depth structure based on content
3. **Clarity**: Light grammar rewrites preserving original phrasing
4. **Redundancy**: Remove duplicates while keeping unique ideas
5. **Metadata**: Extract dates, tags, priorities automatically
6. **Ambiguity**: Bracket unclear segments
7. **Contradictions**: Highlight conflicting statements
8. **Structure Inference**: Create structure even when implicit

## 🔐 Data Storage

The application uses **in-memory storage** for simplicity and speed:

- **Notes**: Stored in JavaScript Map objects
- **Cache**: AI responses cached in memory
- **Lifecycle**: Data persists while the server is running
- **Production**: For production use, replace with persistent database (PostgreSQL, MongoDB, etc.)

## 📦 Deployment

### Frontend (Vercel)

```bash
cd apps/web
vercel
```

Environment variables to set:

- `NEXT_PUBLIC_API_URL` or `API_URL`

### Backend (Cloud/Docker)

```bash
cd apps/api
bun run build
```

Environment variables required:

- `GOOGLE_API_KEY`
- `API_URL`
- `APP_URL`
- All other vars from `.env.example`

Run the built application:

```bash
bun start
```

## 🎨 Customization

### AI Model Configuration

Adjust AI behavior in `.env`:

```env
MODEL_NAME=gemini-1.5-pro
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000
```

### Cache Configuration

Control cache behavior:

```env
CACHE_TTL_HOURS=24
```

### Tone Modes

The system supports 4 distinct tone modes:

- **Original**: Preserves exact user style, slang, and emphasis
- **Professional**: Business-formal, action-oriented language
- **Casual**: Friendly and conversational while maintaining clarity
- **Formal**: Academic style with sophisticated vocabulary

## 🐛 Troubleshooting

### Google Gemini API Errors

```bash
# Check your API key is set
echo $GOOGLE_API_KEY

# Test API connectivity
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY"
```

If you get network errors:

- Check firewall settings
- Verify VPN/proxy configuration
- Ensure your network allows Google API access

### Port Conflicts

Change ports in:

- `.env` - `API_URL` and `APP_URL`
- `apps/web/package.json` - dev script
- `apps/api/src/index.ts` - port constant

### TypeScript Errors

```bash
# Clean and rebuild
bun install
bun run build
```

### Data Loss After Restart

This is expected behavior with in-memory storage. For persistence:

- Add a database (PostgreSQL, MongoDB, etc.)
- Implement data persistence layer
- Or use file-based storage

## 📊 Example Note Transformations

### Example 1: Simple Todo List

**Input:**

```
Buy groceries tomorrow. Milk, eggs, bread.
Also need to call plumber about leaky faucet.
```

**Output:**

- Structured task list with grocery items as subtasks
- Date extraction ("tomorrow")
- Priority inference

### Example 2: Project Planning

**Input:**

```
Project planning meeting notes - March 15.
Frontend team needs user dashboard by Q2 end.
Backend team: API optimization, finish by April.
Sarah mentioned more designers needed but John said budget is tight.
```

**Output:**

- Hierarchical sections (Frontend, Backend, Resources)
- Task extraction with deadlines
- Contradiction detection (designers vs. budget)
- Metadata: dates, priorities, tags

### Example 3: Long Brainstorm

**Input:**

```
had idea for app... social network for dog owners??
features: photo sharing definitely, event calendar for meetups.
marketplace for dog stuff. AI matching for playdates!
need: React Native, Node backend, PostgreSQL.
budget $50k-100k. timeline 6 months MVP.
```

**Output:**

- Core concept section
- Feature breakdown
- Technical implementation tasks
- Team & budget requirements
- Timeline with dependencies
- Ambiguous segments marked

## 🤝 Contributing

This is a proof-of-concept. For production use:

1. Add persistent database (PostgreSQL/MongoDB)
2. Implement user authentication
3. Add rate limiting
4. Add request validation middleware
5. Set up proper logging and monitoring
6. Add comprehensive error handling
7. Implement database connection pooling
8. Add caching layers (Redis)
9. Set up CDN for frontend assets
10. Implement proper CORS policies
11. Add API documentation (Swagger/OpenAPI)

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Architecture Decisions

### Why Next.js App Router?

- Server components for better performance
- Built-in API routes
- Excellent TypeScript support

### Why In-Memory Storage?

- Simplicity and speed for POC
- Zero configuration required
- Easy to replace with persistent storage later

### Why Express?

- Lightweight and flexible
- Excellent TypeScript support
- Easy integration with AI services

### Why Zustand?

- Minimal boilerplate
- Excellent TypeScript support
- No provider wrapping needed
- Perfect for this use case

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 📞 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ as a proof-of-concept for intelligent note transformation**

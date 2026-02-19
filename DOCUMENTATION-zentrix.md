# ZENTRIX OS - BrandGen Application Documentation

## 1. Project Overview

**BrandGen** (also referred to as Brand Generator or "ZENTRIX OS" in the workspace) is an AI-powered strategic marketing application that generates comprehensive brand strategies, competitive analysis, sales angles, and marketing content. 

The application uses a multi-agent AI architecture combining:
- **Firecrawl**: Web scraping to analyze competitor websites
- **Perplexity AI**: Market research and trend analysis
- **Google Gemini**: Strategic content generation and creative writing

The application features a distinctive "cyberpunk corporate" aesthetic with a dark navy background, neon cyan and magenta accents, and a tactical/military-themed UI that refers to marketing activities as "missions," "operations," and "vectors."

---

## 2. Project Structure

```
brandgen/
├── public/
│   ├── logo.png              # Application logo (neon themed)
│   └── vite.svg              # Default Vite favicon
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx     # Main results display after analysis
│   │   ├── StepBrief.jsx     # Input form (brief creation)
│   │   ├── StepProcessing.jsx # Loading/analysis animation
│   │   └── TacticalOverlay.jsx # Modal for objection handling & content generation
│   ├── services/
│   │   ├── geminiService.js    # Gemini API integration
│   │   ├── firecrawlService.js # Web scraping service
│   │   └── perplexityService.js # Market research service
│   ├── assets/
│   │   └── react.svg         # React logo asset
│   ├── App.jsx               # Main application component (state management, orchestration)
│   ├── App.css               # Legacy CSS (mostly unused)
│   ├── index.css             # Global styles, Tailwind imports, custom animations
│   └── main.jsx              # React entry point
├── .env                      # API Keys configuration
├── .gitignore                # Git ignore patterns
├── eslint.config.js          # ESLint configuration
├── index.html                # HTML entry point
├── package-lock.json         # Dependency lock file
├── package.json              # Project dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── README.md                 # Default Vite template README
├── tailwind.config.js        # Tailwind CSS configuration
└── vite.config.js            # Vite bundler configuration
```

---

## 3. Technology Stack

### Core Framework
- **React 19.2.0** - UI library
- **Vite 7.2.4** - Build tool and development server
- **JavaScript (ES6+)** - Language (no TypeScript)

### Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Framer Motion 12.30.0** - Animation library
- **Lucide React 0.563.0** - Icon library
- **Tailwind Merge 3.4.0** - Utility for merging Tailwind classes
- **clsx 2.1.1** - Conditional className (Google utility

### Fonts Fonts)
- **Orbitron** - Futuristic/tech display font (headings)
- **Montserrat** - Clean sans-serif (body text)
- **Fira Code** - Monospace font (code/technical elements)

### Development Tools
- **ESLint 9.39.1** - Code linting
- **PostCSS 8.5.6** - CSS transformation
- **Autoprefixer 10.4.24** - CSS vendor prefixes

---

## 4. Configuration Files Explained

### package.json

```json
{
  "name": "brandgen",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",           // Start development server
    "build": "vite build",   // Production build
    "lint": "eslint .",     // Run linter
    "preview": "vite preview" // Preview production build
  }
}
```

**Key Dependencies:**
- `react` & `react-dom` - React core
- `framer-motion` - Complex animations for the tactical overlay and transitions
- `lucide-react` - Icon set used throughout (Zap, Shield, Target, etc.)
- `tailwindcss` - CSS framework

### tailwind.config.js

Custom theme extension defining the application's color palette:

```javascript
colors: {
  'bg-navy': '#0A0E1A',       // Primary dark background
  'bg-void': '#050507',       // Darker/void background
  'neon-cyan': '#00F0FF',     // Primary accent (cyan)
  'electric-magenta': '#FF007F' // Secondary accent (magenta)
},
fontFamily: {
  orbitron: ['Orbitron', 'sans-serif'],   // Headings
  montserrat: ['Montserrat', 'sans-serif'], // Body
  code: ['Fira Code', 'monospace']        // Technical elements
}
```

### vite.config.js

Minimal Vite configuration with React plugin:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### eslint.config.js

ESLint flat config with React hooks support and React Refresh for HMR.

### .env (API Keys)

```
VITE_GEMINI_API_KEY=AIzaSyBIE3ve9VuCVMHfm7KwFmmlVVN2TNN02zs
VITE_FIRECRAWL_API_KEY=fc-c730d9d8ef33447791f80dee6463c653
VITE_PERPLEXITY_API_KEY=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
```

**Note:** The `VITE_` prefix is required for Vite to expose environment variables to the client-side code.

---

## 5. Component Architecture

### App.jsx (Main Orchestrator)

The central component that manages:

1. **State Management:**
   - `step` - Current workflow stage: `'brief'`, `'processing'`, or `'dashboard'`
   - `loading` - Loading state boolean
   - `error` - Error message storage
   - `formData` - All user inputs (brand name, sector, competitors, etc.)
   - `strategy` - Generated strategy results from AI
   - `processingStatus` - Current status message during analysis
   - `tacticalOverlay` - Modal state for tactical operations

2. **Main Workflow:**
   - User fills out brief (StepBrief)
   - Click "Execute Strategic Analysis" triggers `handleStartAnalysis()`
   - Shows processing animation (StepProcessing)
   - AI agents analyze and generate strategy
   - Results displayed in Dashboard

3. **AI Pipeline (handleStartAnalysis):**
   ```
   1. Firecrawl → Scrape competitor websites (max 3 URLs)
   2. Perplexity → Research market trends and pain points
   3. Gemini → Generate strategic plan with sales angles, ads, landing page structure
   ```

4. **Tactical Operations (handleTacticalOp):**
   - **Objection Handling**: Simulates difficult customer objections and provides counter-arguments ("Judo Verbal")
   - **Content Generation**: Creates TikTok scripts and LinkedIn posts based on sales angles

### StepBrief.jsx

The input form component with two tabs:

**Tab 1: "MI ADN" (Business DNA)**
- Brand Name
- Sector/Industry
- Brand Values & Differential
- Target Audience
- Specific Objectives
- Design System/Aesthetics

**Tab 2: "COMPETENCIA" (Competition)**
- Competitor List (accepts URLs and text)
- Country/Region
- Mission Type (Sales, Leads, Branding)

**Features:**
- "Demo Mode" button - Fills form with fictional "ZER0_TRUST" cybersecurity company data
- Validation - Requires sector and competitors to proceed
- Navigation between tabs

### StepProcessing.jsx

Displays an animated loading screen with:
- Spinning loader icon
- Real-time status messages (e.g., "INICIALIZANDO PROTOCOLO ANTIGRAVITY...")
- Progress bar animation
- Cyberpunk/tactical aesthetic

### Dashboard.jsx

The main results display showing:

1. **Strategic Header** - Brand name, sector, status
2. **Competitor Intelligence (Firecrawl)** - Extracted data from competitor websites
3. **Market Radar (Perplexity)** - Trends, pain points, market insights
4. **Visual & Ads Strategy (Gemini)** - Generated ad variants with image prompts
5. **Landing Blueprint** - Suggested landing page structure
6. **Sales Angles/Vectors** - Generated sales approaches with two action buttons:
   - "Simulate Resistance" - Opens objection handler
   - "Generate Propaganda" - Opens content generator

### TacticalOverlay.jsx

Modal component for tactical operations:

**Objection Simulator Mode:**
- Displays 3 simulated customer objections
- Shows counter-arguments ("Judo Verbal") for each

**Content Generator Mode:**
- TikTok/Reels script (30-second, disruptor tone)
- LinkedIn post (authority tone, professional format)

---

## 6. Services / API Integration

### geminiService.js

**Purpose:** Generates strategic content using Google Gemini

**Configuration:**
- Model: `gemini-2.5-flash-preview-09-2025`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent`

**Features:**
- Supports custom JSON schemas for structured output
- Implements retry logic (3 attempts with exponential backoff)
- Returns parsed JSON response

**Usage in App.jsx:**
- Main strategy generation
- Objection simulation prompts
- Content generation prompts

### firecrawlService.js

**Purpose:** Scrapes competitor websites for intelligence

**Configuration:**
- Endpoint: `https://api.firecrawl.dev/v0/scrape`
- Authorization: Bearer token

**Features:**
- Extracts main content only (`onlyMainContent: true`)
- Returns markdown-formatted content
- Graceful fallback on failure (returns null)

**Usage:**
- Scrapes up to 3 competitor URLs provided in the brief
- Used for competitive analysis

### perplexityService.js

**Purpose:** Researches market trends, user pain points, and industry insights

**Configuration:**
- Model: `sonar-pro` (with search capabilities)
- Endpoint: `https://api.perplexity.ai/chat/completions`

**System Prompt:** "Eres un investigador de mercado experto y cínico. Buscas la verdad oculta que las marcas no dicen."

**Research Focus:**
- Emerging trends (last 6 months)
- User complaints on forums/Reddit (real pain points)
- Common ad promises (to differentiate)

---

## 7. Styling & Theme

### Color Palette

| Color Name      | Hex Code  | Usage                          |
|-----------------|-----------|--------------------------------|
| bg-navy         | #0A0E1A   | Primary background             |
| bg-void         | #050507   | Darker sections, cards        |
| neon-cyan       | #00F0FF   | Primary accent, interactive   |
| electric-magenta| #FF007F   | Secondary accent, CTAs        |

### Typography

- **Orbitron** - Used for: Headings, buttons, nav items
- **Montserrat** - Used for: Body text, form inputs
- **Fira Code** - Used for: Status messages, technical labels

### Custom Animations

Defined in App.jsx (via style tag):
```css
@keyframes progress-bar {
  0% { width: 0%; }
  30% { width: 40%; }
  100% { width: 100%; }
}
.animate-progress-bar {
  animation: progress-bar 4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

### Utility Classes Used

- `text-glow` - Cyan text shadow
- `neon-border` - Glowing border effect on focus
- `tech-card` - Custom styled container (implicit class)

---

## 8. How to Run the Application

### Prerequisites

1. **Node.js** (version 18+ recommended)
2. **npm** or **yarn** package manager

### Installation Steps

1. **Navigate to project directory:**
   ```bash
   cd brandgen
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API Keys:**

   Create a `.env` file in the `brandgen/` directory with your API keys:

   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
   ```

   **How to get API Keys:**
   - **Gemini**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Firecrawl**: Get from [Firecrawl Dashboard](https://dashboard.firecrawl.dev)
   - **Perplexity**: Get from [Perplexity API](https://www.perplexity.ai/settings/api)

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Preview production build:**
   ```bash
   npm run preview
   ```

### Development Server

The development server runs on `http://localhost:5173` by default (Vite default port).

---

## 9. Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  StepBrief (Input Form)                                         │
│  - Brand Info Tab (Name, Sector, Values, Target, Design)        │
│  - Competitor Tab (URLs, Country, Goal)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    "Execute Analysis"
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  StepProcessing (Loading)                                       │
│  - Status messages from AI pipeline                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AI PIPELINE                                                    │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Firecrawl      │    │   Perplexity     │                   │
│  │  (Scrape URLs)   │    │  (Market Research│                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌─────────────────────┐                               │
│           │   Gemini (Strategy)  │                               │
│           │  - Competitor Analysis                                 │
│           │  - Market Insights                                    │
│           │  - Sales Angles                                       │
│           │  - Landing Structure                                 │
│           │  - Ads Strategy (with image prompts)                 │
│           └──────────┬──────────┘                                 │
└──────────────────────┼──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard (Results)                                             │
│  - Competitor Intelligence                                       │
│  - Market Radar                                                  │
│  - Visual & Ads Strategy                                         │
│  - Landing Blueprint                                             │
│  - Sales Vectors (with tactical actions)                        │
└─────────────────────────────────────────────────────────────────┘
                       │
         "Simulate Resistance" / "Generate Propaganda"
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  TacticalOverlay (Modal)                                         │
│  - Objection Handler (Gemini)                                    │
│  - Content Generator (TikTok + LinkedIn)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Key Implementation Details

### React Hooks Usage

- `useState` - All local component state
- `useEffect` - Not prominently used (stateless UI)
- `useRef` - Not used

### State Management Approach

- **Local State Only** - No external state management library (Redux, Zustand, etc.)
- **Lifted State** - All state lives in `App.jsx` and is passed down via props
- **Callback Props** - Child components communicate via callback functions

### Error Handling

- Try-catch blocks in async operations
- Fallback values in Dashboard rendering (e.g., `Array.isArray()` checks)
- Console logging for debugging
- User-friendly error messages displayed in UI

### Performance Considerations

- React 19 with automatic batching
- Vite for fast HMR and optimized builds
- Lazy loading not implemented (single page app, reasonable size)

### Security Notes

- API keys stored in `.env` (not committed to git)
- Client-side only (no backend server)
- No authentication implemented
- Input sanitization not explicitly implemented (relies on AI model)

---

## 11. Customization Guide

### Changing the Theme

Edit `tailwind.config.js`:

```javascript
colors: {
  'bg-navy': '#NEW_HEX',
  'neon-cyan': '#NEW_HEX',
  // ...
}
```

### Adding New Form Fields

1. Add field to `formData` state in `App.jsx`
2. Add input in `StepBrief.jsx`
3. Include field in the prompt sent to Gemini in `App.jsx`

### Modifying AI Behavior

Edit prompts in `App.jsx`:
- Lines 71-101: Main strategy prompt
- Lines 165-171: Objection simulation prompt
- Lines 191-203: Content generation prompt

### Adding New Languages

1. Install language support library (e.g., `i18next`)
2. Create translation files
3. Wrap text in translation keys

---

## 12. Known Limitations

1. **API Key Exposure**: Keys are exposed in client-side code (acceptable for demo/prototype, not for production)
2. **No Persistence**: Data is lost on page refresh (no local storage or database)
3. **Rate Limits**: Subject to API provider rate limits
4. **URL Parsing**: Simple regex for competitor URL extraction (line 52 in App.jsx)
5. **Single User**: No multi-user support or authentication

---

## 13. Troubleshooting

### Common Issues

**"API Key not configured" error:**
- Ensure `.env` file exists with correct `VITE_` prefixed keys
- Restart development server after adding keys

**"Network error" during analysis:**
- Check internet connection
- Verify API keys are valid and have quota remaining

**"CORS" errors:**
- Some API providers may have CORS restrictions
- For production, consider proxying through a backend

**Empty results in Dashboard:**
- Check browser console for errors
- Verify API responses in Network tab

---

## 14. File Manifest

| File | Lines | Purpose |
|------|-------|---------|
| App.jsx | 282 | Main orchestrator, state management, AI pipeline |
| App.css | 42 | Legacy styles (mostly unused) |
| index.css | 25 | Global styles, Tailwind, custom utilities |
| main.jsx | 10 | React entry point |
| Dashboard.jsx | 214 | Results display component |
| StepBrief.jsx | 206 | Input form with tabs |
| StepProcessing.jsx | 24 | Loading animation |
| TacticalOverlay.jsx | 97 | Modal for tactical operations |
| geminiService.js | 91 | Gemini API wrapper |
| firecrawlService.js | 41 | Web scraping service |
| perplexityService.js | 50 | Market research service |
| package.json | 34 | Dependencies and scripts |
| tailwind.config.js | 23 | Theme customization |
| vite.config.js | 7 | Vite configuration |
| eslint.config.js | 29 | Linting rules |
| postcss.config.js | 6 | PostCSS configuration |
| index.html | 13 | HTML entry point |
| .env | 3 | API keys (DO NOT COMMIT) |
| .gitignore | 24 | Git exclusion patterns |

---

*This documentation was generated from code analysis and describes the ZENTRIX OS / BrandGen application as of February 2026.*

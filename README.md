# Academic Dashboard

A modern, feature-rich academic dashboard built with Next.js, React, and TypeScript. Track assignments, exams, grades, and manage your semester schedule all in one place.

## Features

- 📅 **Calendar View** - Visualize all your assignments and exams on a calendar
- 📊 **Grade Tracker** - Track grades with weighted categories and calculate overall GPA
- 📝 **Assignment Management** - Add, edit, and organize assignments, quizzes, exams, and projects
- 🎓 **Semester Management** - Organize classes by semester with custom grade weights
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support
- ⚡ **Fast & Responsive** - Built with Next.js for optimal performance

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd academic-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

The easiest way to deploy this Next.js app is to use [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect Next.js and configure the build settings
4. Your app will be deployed!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deployment

You can also deploy manually:

```bash
npm run build
```

The `out` folder will contain the static export (if configured) or you can use `npm start` for a Node.js server.

## Project Structure

```
academic-dashboard/
├── app/              # Next.js app directory
├── components/       # React components
│   └── ui/          # Reusable UI components
├── lib/             # Utilities and data
├── hooks/           # Custom React hooks
└── public/          # Static assets
```

## Features in Detail

### Assignment Tracking
- Add assignments, quizzes, exams, projects, and lectures
- Set due dates and times
- Track completion status
- Mark late submissions with penalty calculations

### Grade Management
- Weighted grade categories (exams, finals, homework, quizzes, etc.)
- Automatic GPA calculation
- Visual grade charts and statistics
- Support for late penalties

### Semester Organization
- Multiple semester support
- Class-specific grade weights
- Semester date ranges
- Color-coded classes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

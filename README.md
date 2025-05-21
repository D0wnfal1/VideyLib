# VideyLib

A web application for managing and viewing video files with mobile device support.

## Features

- Browse and view videos from selected folders
- Video previewing and playback
- Tag management for videos
- Search videos by name and tags
- Responsive mobile-friendly design

## Tech Stack

- Next.js 15
- React 19
- MongoDB
- Tailwind CSS 4
- TypeScript 5

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud service)

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/D0wnfal1/videylib.git
cd videylib

# Install dependencies
npm install

# Create environment file
echo "MONGODB_URI=mongodb://localhost:27017/videylib" > .env.local
```

### Running the App

#### Option 1: Command Line

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

#### Option 2: One-Click Start (Windows)

For an easier start on Windows, simply double-click the `start-videylib.bat` file in the root directory. This will:

- Start the development server
- Wait for the server to initialize
- Automatically open the application in your default browser

### Production Build

```bash
npm run build
npm start
```

## Usage Guide

1. On first launch, you'll be prompted to specify a video folder path
2. Navigate through folders and open videos for playback
3. Add and manage tags for videos using the tag control panel
4. Use the search bar and tag filtering to find specific videos

## Supported Formats

VideyLib supports the following video formats:

- MP4, WebM, OGG
- MOV, AVI, WMV
- MKV

## Limitations

- For mobile access, the app must run on a computer within the same network
- Video playback capabilities depend on the browser's supported formats and codecs
- Certain advanced video features might be limited by ReactPlayer capabilities

## License

MIT

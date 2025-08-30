# Zenith Browser

A minimalistic, clean browser alternative with modern design - completely original and not related to any existing browsers.

## Features

- 🎨 **Minimalistic Design**: Clean interface with beautiful gradients
- 🚀 **Fast Performance**: Lightweight and optimized for speed
- 🔒 **Privacy Focused**: Built-in tracking protection and privacy controls
- 🎯 **Original**: Completely unique design, not influenced by existing browsers
- 📱 **Cross-Platform**: Works on Windows, macOS, and Linux
- ⚡ **Modern**: Built with Electron and modern web technologies

## Prerequisites

Before running Zenith Browser, you need to install Node.js:

1. **Download Node.js**: Go to https://nodejs.org/
2. **Install**: Download the LTS version and install it
3. **Verify**: Open a command prompt and run:
   ```
   node --version
   npm --version
   ```

## Installation

1. **Clone or download** this repository
2. **Open terminal** in the project directory
3. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the Browser

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Build for Distribution
```bash
npm run dist
```

## Project Structure

```
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # Main application entry
│   │   └── preload.js  # Secure preload script
│   └── renderer/       # Browser UI
│       ├── index.html  # Main interface
│       ├── styles/     # CSS stylesheets
│       └── scripts/    # JavaScript functionality
├── assets/
│   └── icons/          # Application icons
└── package.json        # Project configuration
```

## Key Features

### Navigation
- **Address Bar**: Combined URL and search input
- **Tab Management**: Create, switch, and close tabs
- **History**: Back/forward navigation
- **Bookmarks**: Save and organize favorite sites

### Interface
- **Custom Title Bar**: Frameless window with custom controls
- **Responsive Design**: Adapts to different window sizes
- **Smooth Animations**: Subtle transitions and effects
- **Clean Typography**: Readable and modern fonts

### Privacy & Security
- **HTTPS Enforcement**: Prefer secure connections
- **Tracking Protection**: Block tracking scripts
- **Secure Context**: Sandboxed content rendering
- **Privacy Settings**: Granular privacy controls

### Settings & Customization
- **Theme Options**: Light, dark, and auto themes
- **Font Settings**: Adjustable size and family
- **Homepage**: Customizable start page
- **Search Engine**: Multiple search engine options

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New Tab |
| `Ctrl+W` | Close Tab |
| `Ctrl+R` | Reload Page |
| `Ctrl+L` | Focus Address Bar |
| `Alt+Left` | Go Back |
| `Alt+Right` | Go Forward |
| `Alt+Home` | Go Home |
| `Ctrl+1-9` | Switch to Tab |

## Development

### Adding Features
1. **Main Process**: Add functionality to `src/main/main.js`
2. **UI Components**: Create in `src/renderer/`
3. **Styling**: Add CSS to `src/renderer/styles/`
4. **JavaScript**: Add logic to `src/renderer/scripts/`

### Building
- **Development**: Hot reload with `npm run dev`
- **Testing**: Build without publishing with `npm run pack`
- **Distribution**: Create installers with `npm run dist`

## Contributing

This is a personal project to create an original, minimalistic browser alternative. The design focuses on:

- **Simplicity**: Only essential features
- **Performance**: Fast and lightweight
- **Privacy**: User-focused privacy controls
- **Originality**: Unique design not copying existing browsers

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the console for error messages
2. Ensure Node.js is properly installed
3. Try reinstalling dependencies with `npm install`
4. Make sure all files are present in the project structure

---

**Zenith Browser** - A fresh, minimalistic approach to web browsing.
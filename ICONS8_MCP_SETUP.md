# Icons8 MCP Server Setup for Zenith DAW

This guide explains how to use the Icons8 Model Context Protocol (MCP) server with your AI coding assistant to access 50,000+ professional icons for the Zenith DAW.

## What is Icons8 MCP?

Icons8 provides an MCP server that allows you to:
- Access 50,000+ professional icons directly in your IDE
- Request icons for specific use cases (e.g., "Create transport control icons for a DAW")
- Get icons in multiple styles: color, outline, filled, ios-glyph
- Have your AI assistant generate icon code automatically

## Setup Instructions

### Step 1: Check Compatibility

Your editor must support **Server-Sent Events (SSE)** based MCP communication. Supported editors include:
- **Claude Desktop** (recommended)
- **Cursor** 
- **Windsurf**
- **VS Code** (with MCP Client extension)
- Other editors with SSE support

### Step 2: Add MCP Server Configuration

The configuration is already set up in `.mcp.json`. If you need to add it to your Claude Desktop or other editor:

```json
{
  "mcpServers": {
    "icons8mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.icons8.com/mcp/"
      ]
    }
  }
}
```

### Step 3: Use Icons8 in Your AI Assistant

Once configured, ask your AI assistant to create icons:

```
"Create button icons for play, pause, stop in ios glyph style with primary color"
"Generate 24px transport control icons (play, pause, record, stop)"
"Create effect icons for EQ, reverb, and delay in color style"
"Design DAW control icons: mute, solo, arm track, delete, undo, redo"
```

## Usage Examples for Zenith DAW

### Transport Controls
```
"Create small (24px) transport control icons in ios-glyph style:
- play-button (green)
- pause-button (orange)
- stop-button (red)
- record (red)"
```

### Track Controls
```
"Generate 16px track control icons for a DAW:
- mute icon
- solo (hearing/ear icon)
- arm/record ready
- delete/trash icon"
```

### Editing Tools
```
"Create editing toolbar icons (20px) for:
- cut
- copy
- paste
- undo
- redo"
```

### AI Music & Effects
```
"Generate icons for AI music features:
- artificial-intelligence (for AI generation button)
- music-selection (for synth/generator)
- sound-mixer (for effects)
- equalizer (for EQ effects)"
```

## Direct CDN Usage

You can also directly use Icons8's CDN to embed icons:

```typescript
// URL format
https://img.icons8.com/{style}/{size}/{color}/{icon-name}.png

// Example
https://img.icons8.com/ios-glyph/32/6366f1/play-button.png
```

### Parameters:
- **style**: `color`, `outline`, `filled`, `ios-glyph`
- **size**: `24`, `32`, `48`, `64`, `128` (or other sizes)
- **color**: Hex color without `#` (e.g., `6366f1` for primary color)
- **icon-name**: Icon name with hyphens (e.g., `play-button`)

## Available Icon Styles for DAW

### ios-glyph (Recommended for DAW)
Minimal, clean outline style perfect for DAW buttons:
- play-button, pause-button, stop-button, record
- mute, hearing (solo), microphone (arm)
- cut, copy, paste, undo, redo

### Color
Colorful style for icons that need emphasis:
- artificial-intelligence (purple)
- music-selection (blue)
- sound-mixer (orange)
- equalizer (green)

### Outline
Professional outlined style:
- settings, help, info
- save, export, import, delete

### Filled
Solid style for high-visibility buttons:
- zoom-in, zoom-out
- expand, collapse

## Licensing & Attribution

**Current Plan**: GitHub License (Free)
- PNG icons available
- Attribution required: "Icons by Icons8 (https://icons8.com)"

**To Upgrade**: Access SVG icons and remove attribution requirement
- Visit: https://icons8.com/pricing
- Plans available for different icon formats

## Useful Icons for Zenith DAW

| Category | Icons |
|----------|-------|
| Transport | play-button, pause-button, stop-button, record |
| Track Controls | mute, hearing, microphone, delete |
| Editing | cut, copy, paste, undo, redo |
| View | zoom-in, zoom-out, expand, collapse |
| File Operations | save, export, import, open-in-mobile |
| Settings | settings, help, info, menu |
| Audio/Music | musical-notes, speaker, microphone |
| AI Features | artificial-intelligence, music-selection, sound-mixer |
| Effects | equalizer, echo, hourglass |

## Integration with Zenith DAW

To integrate Icons8 icons into the DAW:

1. **Ask your AI assistant** to generate icon components:
   ```
   "Create React components for DAW transport buttons using Icons8 
    ios-glyph style icons in the primary color (#6366f1)"
   ```

2. **Or use the CDN directly** in your components:
   ```jsx
   <img 
     src="https://img.icons8.com/ios-glyph/32/6366f1/play-button.png" 
     alt="Play" 
   />
   ```

3. **Update button styles** to include icon images alongside text

## Testing

To verify the MCP server is connected:
1. Start your AI assistant (Claude Desktop, Cursor, etc.)
2. Look for "icons8mcp" in the list of available tools/servers
3. Try a simple request: "Show me a play button icon"
4. The AI should suggest using Icons8 and provide URLs or code

## Resources

- **Icons8 Website**: https://icons8.com
- **Icons8 MCP Documentation**: https://icons8.com/mcp
- **Icon Search**: https://icons8.com/icons
- **MCP Protocol Docs**: https://modelcontextprotocol.io/

## Support

For issues or questions:
1. Check Icons8 FAQ: https://icons8.com/faq
2. Visit Icons8 Support: https://icons8.com/support
3. See MCP Protocol documentation for server setup issues

# Tasks - LKLY.net

A minimalist, high-performance Kanban board built with modern web technologies. Part of the LKLY.net suite of developer tools.

## Features

- 🚀 Blazing fast, static-first architecture
- 🎯 Clean, minimalist interface
- 🔄 Real-time board updates with optimistic UI
- 🔗 Shareable board URLs
- 🎨 Automatic column colorization
- 📱 Mobile-responsive design
- ⌨️ Full keyboard navigation support
- ♿ WCAG accessibility compliant
- 🔍 SEO optimized
- 🌓 Dark theme by default

## Tech Stack

### Frontend

- Vanilla JavaScript for core functionality
- Tailwind CSS for styling
- Font Awesome for icons
- Zero build process
- No framework dependencies

### Backend

- Cloudflare Workers for API
- Cloudflare KV for data storage
- Cloudflare Pages for static hosting

## Development

1. Clone the repository:

```bash
git clone https://github.com/lkly/tasks.git
cd tasks
```

2. Create a Cloudflare Pages project:

- Connect your GitHub repository
- Set the build command to: (none)
- Set the build output directory to: .
- Add environment variable:
  - `API_KEY`: Your chosen API key for backend access

3. Create a Cloudflare Worker:

- Copy the contents of `worker.js` to a new Cloudflare Worker
- Create a new KV namespace called `TASKS_DB`
- Bind the KV namespace to your worker with the variable name `TASKS_DB`
- Add environment variable:
  - `API_KEY`: Same value as used in Pages

4. Configure your domain:

- Add your domain to Cloudflare DNS
- Point it to your Cloudflare Pages deployment
- Add a route pattern for `/api/*` to your Worker

## Features

### Board Configuration

- Text-based configuration for easy editing
- Real-time preview of changes
- Automatic saving with status indicator

### Task Management

- Drag and drop tasks between columns
- Click to mark tasks as complete
- Keyboard navigation support
- Visual feedback for task status

### Column Management

- Add/remove columns easily
- Automatic color assignment
- Resizable sidebar for configuration

### Sharing & Collaboration

- Unique URL for each board
- Easy link copying
- Real-time updates

## Performance

The application is optimized for performance:

- Static asset delivery through Cloudflare's edge network
- Minimal JavaScript footprint
- No external dependencies
- Efficient DOM updates
- Optimized for Core Web Vitals

## Security

- API key authentication for all requests
- CORS protection
- No sensitive data in client-side code
- Cloudflare's security features by default

## Browser Support

Supports all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: [Report a bug](https://github.com/lkly/tasks/issues)
- Twitter: [@itslkly](https://twitter.com/itslkly)
- Website: [lkly.net](https://lkly.net)

# Tasks - LKLY.net

A minimalist, keyboard-driven Kanban board application built with modern web technologies. Part of the LKLY.net suite of developer tools.

## Features

### Core Functionality

- Clean, minimalist interface with dark theme
- Real-time board updates with auto-saving
- Drag-and-drop task management
- Resizable sidebar with configuration editor
- Shareable board URLs
- Mobile-responsive design

### Keyboard Shortcuts

- `Ctrl/Cmd + /` - Focus configuration editor
- `Ctrl/Cmd + N` - Create new board
- `Ctrl/Cmd + Shift + C` - Copy board link
- `Ctrl/Cmd + B` - Add new column
- `Ctrl/Cmd + T` - Add new task
- `Enter/Space` - Toggle task completion

### Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- High contrast color scheme
- Focus management
- Semantic HTML structure

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

### Performance

- Static site generation
- Edge-first architecture
- Minimal JavaScript footprint
- Optimized for Cloudflare's global network

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
- Add environment variable: `API_KEY`

3. Create a Cloudflare Worker:

- Copy the contents of `worker.js` to a new Cloudflare Worker
- Create a new KV namespace called `TASKS_DB`
- Bind the KV namespace to your worker with variable name `TASKS_DB`

4. Configure your domain:

- Add `tasks.lkly.net` to your Cloudflare DNS
- Point it to your Cloudflare Pages deployment
- Add a route pattern for `/api/*` to your Worker

## Configuration Format

The board configuration uses a simple text format:

```
Board Name
/ Column Name
@ Task 1
completed: true
@ Task 2
/ Another Column
@ Task 3
```

## Security

- API key authentication required
- CORS protection enabled
- Rate limiting on the API
- No sensitive data stored
- All data encrypted at rest

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supported

## Environment Setup

Required environment variables for the Worker:

```env
TASKS_DB=your-kv-namespace-binding
```

## Deployment

The project is automatically deployed through Cloudflare Pages when changes are pushed to the main branch.

1. Static site (Cloudflare Pages):

   - Automatically deploys from the main branch
   - No build step required
   - Serves static assets and handles client-side routing

2. API (Cloudflare Worker):
   - Deploy through Cloudflare Dashboard or Wrangler
   - Ensure KV namespace is properly bound
   - Route pattern: `tasks.lkly.net/api/*`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m '[Feature] Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: [Report a bug](https://github.com/lkly/tasks/issues)
- Twitter: [@itslkly](https://twitter.com/itslkly)
- Website: [lkly.net](https://lkly.net)

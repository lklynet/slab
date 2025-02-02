# Tasks - LKLY.net

A minimalist Kanban board application built with modern web technologies. Part of the LKLY.net suite of developer tools.

## Features

- Clean, minimalist interface
- Real-time board updates
- Shareable board URLs
- Drag-and-drop task management
- Dark theme by default
- Mobile-responsive design

## Tech Stack

- Frontend:

  - HTML + Tailwind CSS for styling
  - Alpine.js for reactivity
  - Zero build process
  - No framework dependencies

- Backend:
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
- Deploy!

3. Create a Cloudflare Worker:

- Copy the contents of `worker.js` to a new Cloudflare Worker
- Create a new KV namespace called `TASKS_DB`
- Bind the KV namespace to your worker with the variable name `TASKS_DB`

4. Configure your domain:

- Add `tasks.lkly.net` to your Cloudflare DNS
- Point it to your Cloudflare Pages deployment
- Add a route pattern for `/api/*` to your Worker

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

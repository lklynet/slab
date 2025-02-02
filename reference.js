export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/" || path === "") {
    // Create a new board and redirect
    const boardId = generateBoardId();
    const defaultConfig = `My Kanban Board
  /To Do
  /Doing
  /Done`;

    // Get the current Unix timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Insert the new board into the database
    await env.KANBAN_DB.prepare(
      "INSERT INTO boards (id, config, created_at) VALUES (?, ?, ?)"
    )
      .bind(boardId, defaultConfig, timestamp)
      .run();

    // Redirect to the new board URL
    return Response.redirect(`${url.origin}/${boardId}`, 302);
  } else {
    const boardId = path.substring(1);

    if (request.method === "GET") {
      // Fetch the board configuration from the database
      const { results } = await env.KANBAN_DB.prepare(
        "SELECT config FROM boards WHERE id = ?"
      )
        .bind(boardId)
        .all();

      if (results.length > 0) {
        const boardConfig = results[0].config;

        // Serve the HTML page with the board config embedded
        return new Response(renderHTML(boardConfig), {
          headers: { "Content-Type": "text/html" },
        });
      } else {
        // Board not found
        return new Response("Board not found", { status: 404 });
      }
    } else if (request.method === "POST") {
      // Update the board configuration in the database
      const formData = await request.formData();
      const config = formData.get("config");

      await env.KANBAN_DB.prepare("UPDATE boards SET config = ? WHERE id = ?")
        .bind(config, boardId)
        .run();

      return new Response("Board updated", { status: 200 });
    } else if (request.method === "DELETE") {
      // Delete the board from the database
      await env.KANBAN_DB.prepare("DELETE FROM boards WHERE id = ?")
        .bind(boardId)
        .run();

      // Redirect to the root to create a new board
      return Response.redirect(`${url.origin}/`, 302);
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  }
}

// Function to generate a unique board ID
function generateBoardId() {
  return [...Array(8)].map(() => Math.random().toString(36)[2]).join("");
}

// Function to render the HTML page with the board configuration
function renderHTML(boardConfig) {
  // Include your CSS and JS code here
  const css = `
    /* Root Variables */
    :root {
      --bg-color: #0d0d0d;
      --text-color: #e6e6e6;
      --sidebar-bg: #1a1a1a;
      --menu-bg: #262626;
      --menu-hover-bg: #333333;
      --border-color: #404040;
      --font-primary: 'Roboto Mono', monospace;
      --highlight-bg: #ff6347;
      --save-green: #32CD32;
      --save-yellow: #FFD700;
      --save-red: #FF4500;
    }
    
    .save-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--save-green);
      margin-right: 5px;
    }
  
    /* Reset and Basic Styles */
    body {
      margin: 0;
      font-family: var(--font-primary);
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    /* Header Styles */
    .header {
      display: flex;
      align-items: center;
      padding: 10px;
      background-color: var(--sidebar-bg);
      box-sizing: border-box;
      border-bottom: 0px solid var(--border-color);
    }
    
    .app-title {
      flex-grow: 1;
      text-align: center;
      font-size: 1.2rem;
      color: var(--text-color);
      font-weight: bold;
      cursor: pointer;
    }
    
    /* Menu Button */
    .menu-button {
      font-size: 24px;
      cursor: pointer;
      user-select: none;
      color: var(--text-color);
      position: relative;
    }
    
    /* Dropdown Menu */
    .dropdown-menu {
      display: none;
      position: absolute;
      top: 30px;
      left: 0;
      background-color: var(--menu-bg);
      border: 1px solid var(--border-color);
      z-index: 1000;
    }
    
    .dropdown-menu.show {
      display: block;
    }
    
    .dropdown-menu button {
      display: block;
      width: 200px;
      padding: 8px;
      text-align: left;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--text-color);
      font-weight: bold;
      font-size: 0.75rem;
    }
    
    .dropdown-menu button:hover {
      background-color: var(--menu-hover-bg);
    }
    
    /* Main Container */
    .container {
      display: flex;
      height: 100vh;
      margin-top: 0;
      overflow: hidden;
    }
    
    /* Sidebar */
    #sidebar {
      width: 280px;
      min-width: 180px;
      max-width: 450px;
      background-color: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      resize: horizontal;
      padding: 10px;
      box-sizing: border-box;
    }
    
    /* Splitter */
    #splitter {
      width: 10px;
      background-color: var(--sidebar-bg);
      cursor: col-resize;
    }
    
    /* Board Config Textarea */
    #board-config {
      width: 100%;
      flex-grow: 1;
      resize: none;
      border: 0px solid var(--border-color);
      padding: 10px;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-size: 0.85rem;
    }
    
    /* Sidebar Buttons */
    .sidebar-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px;
      background-color: var(--sidebar-bg);
      position: sticky;
      bottom: 0;
    }
    
    .sidebar-buttons button {
      flex: 1 1 calc(50% - 4px);
      padding: 6px;
      cursor: pointer;
      background-color: var(--menu-bg);
      border: none;
      color: var(--text-color);
      border-radius: 4px;
      text-align: center;
      transition: background-color 0.3s;
      font-size: 0.75rem;
      font-weight: bold;
    }
    
    .sidebar-buttons button:hover {
      background-color: var(--highlight-bg);
    }
    
    .sidebar-buttons button i {
      margin-right: 5px;
    }
    
    /* Board Container */
    #board-container {
      flex-grow: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    #board-title {
      font-size: 1rem;
      margin-bottom: 20px;
      text-align: left;
    }
    
    #board {
      display: flex;
      overflow-x: auto;
      flex-grow: 1;
    }
    
    /* Column Styles */
    .column {
      min-width: 250px;
      background-color: var(--menu-bg);
      margin-right: 10px;
      border-radius: 4px;
      padding: 0;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
      font-size: 0.75rem;
      display: flex;
      flex-direction: column;
    }
    
    .column h2 {
      background-color: #333333;
      padding: 10px;
      margin: 0;
      border-radius: 4px 4px 0 0;
      text-align: center;
      color: var(--text-color);
      font-weight: bold;
    }
    
    /* Tasks */
    .tasks {
      flex-grow: 1;
      padding: 5px;
      overflow-y: auto;
    }
    
    .task {
      background-color: var(--border-color);
      padding: 8px;
      margin-bottom: 8px;
      cursor: grab;
      border-radius: 4px;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
      color: var(--text-color);
      transition: background-color 0.3s ease;
    }
    
    .task:hover {
      background-color: var(--highlight-bg);
    }
    
    .task.completed {
      text-decoration: none;
      opacity: 0.8;
      background-color: #2e7d32;
      color: #ffffff;
    }
    
    /* Task Content and Icon */
    .task-content {
      display: flex;
      align-items: center;
    }
    
    .task .checkmark {
      margin-right: 5px;
      color: #ffffff;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .container {
        flex-direction: column;
        height: auto;
      }
      #sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }
      #board {
        flex-wrap: wrap;
      }
    }
  `;

  const js = `
  // Initialize the app
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    parseBoardConfig();
    setupSplitter(); // Ensure the splitter setup is called after the DOM content is loaded
  });
  
  let boardData = {}; // Global variable to store board data
  let isProgrammaticChange = false; // Flag to track programmatic changes
  
  // Debounce function
  function debounce(func, delay) {
    let debounceTimer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  }
  
  // Setup Event Listeners
  function setupEventListeners() {
    const boardConfigTextarea = document.getElementById('board-config');
    const saveStatus = document.getElementById('save-status');
    saveBoardConfig(); // Save after parsing, with debouncing
    saveStatus.style.backgroundColor = 'var(--save-yellow)';
    saveBoardConfig().then(() => {
      saveStatus.style.backgroundColor = 'var(--save-green)';
    }).catch(() => {
      saveStatus.style.backgroundColor = 'var(--save-red)';
    });
    boardConfigTextarea.addEventListener('input', debounce(() => {
      // User is typing, so we don't set the flag
      parseBoardConfig();
    }, 500));
  
    document.getElementById('add-column').addEventListener('click', () => {
      const boardConfigTextarea = document.getElementById('board-config');
      boardConfigTextarea.value += '\\n/ New Column';
      // User is modifying the text area, so we don't set the flag
      parseBoardConfig();
      saveBoardConfig(); // Save the new configuration
    });
  
    document.getElementById('add-item').addEventListener('click', () => {
      const boardConfigTextarea = document.getElementById('board-config');
      boardConfigTextarea.value += '\\n@ New Task';
      // User is modifying the text area, so we don't set the flag
      parseBoardConfig();
      saveBoardConfig(); // Save the new configuration
    });
  
    // Menu button actions
    document.getElementById('start-new').addEventListener('click', startNewBoard);
    document.getElementById('copy-link').addEventListener('click', copyLink);
    document.getElementById('clone').addEventListener('click', cloneBoard);
    document.getElementById('delete-board').addEventListener('click', deleteBoard);
  
    // Menu button toggle
    const menuButton = document.getElementById('menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
  
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });
  
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!menuButton.contains(event.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  }
  
  // Setup the splitter for resizing the sidebar
  function setupSplitter() {
    const splitter = document.getElementById('splitter');
    const sidebar = document.getElementById('sidebar');
    let isDragging = false;
  
    splitter.addEventListener('mousedown', function (e) {
      e.preventDefault(); // Prevent text selection
      isDragging = true;
      document.body.style.cursor = 'col-resize';
  
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  
    function onMouseMove(e) {
      if (!isDragging) return;
      e.preventDefault(); // Prevent default behavior during dragging
  
      let newWidth = e.clientX;
  
      // Enforce minimum and maximum widths
      const minWidth = 200;
      const maxWidth = 500;
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;
  
      sidebar.style.width = newWidth + 'px';
    }
  
    function onMouseUp(e) {
      if (!isDragging) return;
      e.preventDefault(); // Prevent default behavior
  
      isDragging = false;
      document.body.style.cursor = 'default';
  
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
  }
  
  // Parse the board configuration from the text area
  function parseBoardConfig() {
    const boardConfigTextarea = document.getElementById('board-config');
    const boardConfigText = boardConfigTextarea.value;
    const lines = boardConfigText.split('\\n');
    let boardName = '';
    let columns = [];
    let currentColumn = null;
  
    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('/')) {
        // New Column
        currentColumn = {
          name: line.substring(1).trim(),
          tasks: []
        };
        columns.push(currentColumn);
      } else if (line.startsWith('@') && currentColumn) {
        // New Task
        currentColumn.tasks.push({
          text: line.substring(1).trim(),
          completed: false
        });
      } else if (line.startsWith('completed:') && currentColumn && currentColumn.tasks.length > 0) {
        // Mark Task as Completed
        const lastTask = currentColumn.tasks[currentColumn.tasks.length - 1];
        lastTask.completed = line.includes('true');
      } else if (line && !currentColumn) {
        // Board Name
        boardName = line;
      }
    });
  
    // Update the global board data
    boardData = {
      name: boardName,
      columns: columns
    };
  
    renderBoard();
  }
  
  // Render the Kanban board
  function renderBoard() {
    const boardTitleElement = document.getElementById('board-title');
    const boardContainer = document.getElementById('board');
    boardContainer.innerHTML = '';
  
    // Set board title
    boardTitleElement.textContent = boardData.name || 'My Kanban Board';
  
    // Set document title to board name
    document.title = boardData.name || 'My Kanban Board';
  
    boardData.columns.forEach((column, columnIndex) => {
      const columnElement = document.createElement('div');
      columnElement.className = 'column';
  
      // Column title
      const columnTitle = document.createElement('h2');
      columnTitle.textContent = column.name;
      columnTitle.style.backgroundColor = getColumnColor(columnIndex);
      columnElement.appendChild(columnTitle);
  
      // Tasks container
      const tasksContainer = document.createElement('div');
      tasksContainer.className = 'tasks';
      tasksContainer.addEventListener('dragover', dragOver);
      tasksContainer.addEventListener('drop', (e) => dropTask(e, columnIndex));
      columnElement.appendChild(tasksContainer);
  
      // Render tasks
      column.tasks.forEach((task, taskIndex) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        if (task.completed) {
          taskElement.classList.add('completed');
        }
        taskElement.draggable = true;
        taskElement.dataset.columnIndex = columnIndex;
        taskElement.dataset.taskIndex = taskIndex;
        taskElement.addEventListener('dragstart', dragStart);
  
        // Create a container for the task content
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
  
        if (task.completed) {
          // Add checkmark icon
          const checkmark = document.createElement('i');
          checkmark.className = 'fas fa-check-circle checkmark';
          taskContent.appendChild(checkmark);
        }
  
        // Add task text
        const taskText = document.createElement('span');
        taskText.textContent = task.text;
        taskContent.appendChild(taskText);
  
        taskElement.appendChild(taskContent);
  
        taskElement.addEventListener('click', () => toggleTaskCompletion(columnIndex, taskIndex));
  
        tasksContainer.appendChild(taskElement);
      });
  
      boardContainer.appendChild(columnElement);
    });
  
    // Update the text area if a programmatic change occurred
    if (isProgrammaticChange) {
      updateBoardConfigText();
      saveBoardConfig(); // Save the updated configuration
      isProgrammaticChange = false; // Reset the flag
    }
  }
  
  // Update the board configuration text area based on the data model
  function updateBoardConfigText() {
    const boardConfigTextarea = document.getElementById('board-config');
    let lines = [];
    lines.push(boardData.name);
    boardData.columns.forEach(column => {
      lines.push('/ ' + column.name);
      column.tasks.forEach(task => {
        lines.push('@ ' + task.text);
        if (task.completed) {
          lines.push('completed: true');
        }
      });
    });
    boardConfigTextarea.value = lines.join('\\n');
  }
  
  // Assign automatic colors to columns
  function getColumnColor(index) {
    const colors = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', '#fb8500', '#7209b7', '#9381ff'];
    return colors[index % colors.length];
  }
  
  // Drag and Drop Functions
  function dragStart(event) {
    const columnIndex = event.target.dataset.columnIndex;
    const taskIndex = event.target.dataset.taskIndex;
    event.dataTransfer.setData('text/plain', JSON.stringify({ columnIndex, taskIndex }));
  }
  
  function dragOver(event) {
    event.preventDefault();
  }
  
  function dropTask(event, targetColumnIndex) {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    const { columnIndex, taskIndex } = data;
  
    // Update the board data
    const sourceColumnIndex = parseInt(columnIndex);
    const sourceTaskIndex = parseInt(taskIndex);
    targetColumnIndex = parseInt(targetColumnIndex);
  
    // Remove task from source column
    const [movedTask] = boardData.columns[sourceColumnIndex].tasks.splice(sourceTaskIndex, 1);
  
    // Add task to target column
    boardData.columns[targetColumnIndex].tasks.push(movedTask);
  
    // Set the flag before rendering
    isProgrammaticChange = true;
  
    // Re-render the board
    renderBoard();
  }
  
  function toggleTaskCompletion(columnIndex, taskIndex) {
    const task = boardData.columns[columnIndex].tasks[taskIndex];
    task.completed = !task.completed;
  
    // Set the flag before rendering
    isProgrammaticChange = true;
  
    // Re-render the board
    renderBoard();
  }
  
  // Save the board configuration to the server
  async function saveBoardConfig() {
    const configText = document.getElementById('board-config').value;
  
    // Send a POST request to the server to save the config
    try {
      await fetch(window.location.pathname, {
        method: 'POST',
        body: new URLSearchParams({ config: configText }),
      });
    } catch (error) {
      console.error('Failed to save board configuration:', error);
      throw error; // Propagate error for catching in the event listener
    }
  }
  
  
  // Menu Button Actions
  function startNewBoard() {
    if (confirm('Are you sure you want to start a new board?')) {
      window.location.href = '/'; // Redirects to the root, which will create a new board
    }
  }
  
  function copyLink() {
    // Copy the current URL to the clipboard
    const shareableLink = window.location.href;
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert('Link copied to clipboard!');
    }, () => {
      alert('Failed to copy link.');
    });
  }
  
  function cloneBoard() {
    alert('Clone functionality is not implemented yet.');
  }
  
  async function deleteBoard() {
    if (confirm('Are you sure you want to delete this board?')) {
      try {
        await fetch(window.location.pathname, { method: 'DELETE' });
        window.location.href = '/'; // Redirect to root to create a new board
      } catch (error) {
        console.error('Failed to delete board:', error);
      }
    }
  }
  `;

  // Return the complete HTML page
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <script src="https://post.lkly.net/inject.js"></script>
    <meta charset="UTF-8">
    <title>${boardConfig.split("\n")[0] || "My Kanban Board"}</title>
    <style>
      ${css}
    </style>
    <!-- Include FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="https://use.typekit.net/bop8ekr.css">
  </head>
  <body>
    <!-- Main Container -->
    <div class="container">
      <!-- Sidebar -->
      <div class="sidebar" id="sidebar">
        <!-- Header inside the sidebar -->
        <div class="header">
  
        <div class="top-bar">
      </div>
      
  
          <div class="menu-button" id="menu-button">
            ☰
            <div class="dropdown-menu" id="dropdown-menu">
              <button id="start-new">Start New</button>
              <button id="copy-link">Copy Link</button>
              <button id="clone">Clone</button>
              <button id="delete-board">Delete</button>
            </div>
          </div>
          <div class="app-title">[>_ ] lkly.net</div>
          <span id="save-status" class="save-status"></span>
        </div>
        <textarea id="board-config" placeholder="Enter board configuration...">${boardConfig}</textarea>
        <div class="sidebar-buttons">
          <button id="add-column"><i class="fas fa-plus-square"></i> Add Column</button>
          <button id="add-item"><i class="fas fa-plus"></i> Add Item</button>
          <button id="add-item">Like these tools? <a href="https://buymeacoffee.com/lkly" target="_blank">Buy me a coffee! ☕</a> | Follow on X: <a href="https://x.com/itslkly" target="_blank">@itslkly</a></button>
        </div>
      </div>
  
      <!-- Splitter -->
      <div id="splitter"></div>
  
      <!-- Main Board -->
      <div id="board-container">
        <div id="board-title"></div> 
        <div id="board"></div>
      </div>
    </div>
  
    <script>
      ${js}
    </script>
  </body>
  </html>
  `;
}

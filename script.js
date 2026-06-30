// Initialize the app
document.addEventListener("DOMContentLoaded", async () => {
  const path = window.location.pathname;

  // If we're at the root, create a new board
  if (path === "/" || path === "") {
    try {
      const response = await fetchAPI("/");
      const data = await response.json();
      if (data.boardId) {
        window.location.href = `/${data.boardId}`;
        return;
      }
      throw new Error("No boardId received");
    } catch (error) {
      console.error("Failed to create new board:", error);
      alert("Failed to create new board. Please try again.");
      return;
    }
  }

  try {
    // Load existing board configuration
    const response = await fetchAPI(path);
    const data = await response.json();
    if (data.config) {
      const boardConfigTextarea = document.getElementById("board-config");
      boardConfigTextarea.value = data.config;
    }

    // Initialize board
    setupEventListeners();
    parseBoardConfig();
    setupSplitter();
  } catch (error) {
    console.error("Failed to initialize board:", error);
    alert("Failed to load board. Please try refreshing the page.");
  }
});

let boardData = {};
let isProgrammaticChange = false;

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response;
}

// Setup Event Listeners
function setupEventListeners() {
  const boardConfigTextarea = document.getElementById("board-config");
  boardConfigTextarea.addEventListener("input", () => {
    parseBoardConfig();
    saveBoardConfig();
  });

  document.getElementById("add-column").addEventListener("click", () => {
    const boardConfigTextarea = document.getElementById("board-config");
    boardConfigTextarea.value += "\n/ New Column";
    parseBoardConfig();
    saveBoardConfig();
  });

  document.getElementById("add-item").addEventListener("click", () => {
    const boardConfigTextarea = document.getElementById("board-config");
    boardConfigTextarea.value += "\n@ New Task";
    parseBoardConfig();
    saveBoardConfig();
  });

  // Menu button actions
  document.getElementById("start-new").addEventListener("click", startNewBoard);
  document.getElementById("copy-link").addEventListener("click", copyLink);
  document
    .getElementById("delete-board")
    .addEventListener("click", deleteBoard);

  // Menu button toggle
  const menuButton = document.getElementById("menu-button");
  const dropdownMenu = document.getElementById("dropdown-menu");

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const isExpanded = dropdownMenu.classList.toggle("hidden");
    menuButton.setAttribute("aria-expanded", !isExpanded);
  });

  // Close menu when clicking outside
  document.addEventListener("click", (event) => {
    if (!menuButton.contains(event.target)) {
      dropdownMenu.classList.add("hidden");
    }
  });
}

// Parse the board configuration from the text area
function parseBoardConfig() {
  const boardConfigTextarea = document.getElementById("board-config");
  const boardConfigText = boardConfigTextarea.value;
  const lines = boardConfigText.split("\n");
  let boardName = "";
  let columns = [];
  let currentColumn = null;

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith("/")) {
      currentColumn = {
        name: line.substring(1).trim(),
        tasks: [],
      };
      columns.push(currentColumn);
    } else if (line.startsWith("!") && currentColumn) {
      currentColumn.tasks.push({
        text: line.substring(1).trim(),
        completed: true,
      });
    } else if (line.startsWith("@") && currentColumn) {
      currentColumn.tasks.push({
        text: line.substring(1).trim(),
        completed: false,
      });
    } else if (line && !currentColumn) {
      boardName = line;
    }
  });

  boardData = {
    name: boardName,
    columns: columns,
  };

  renderBoard();
}

// Render the Kanban board
function renderBoard() {
  const boardTitleElement = document.getElementById("board-title");
  const boardContainer = document.getElementById("board");
  boardContainer.innerHTML = "";

  boardTitleElement.textContent = boardData.name || "slab";
  document.title = boardData.name || "slab";

  boardData.columns.forEach((column, columnIndex) => {
    const columnElement = document.createElement("div");
    columnElement.className = "column";
    columnElement.setAttribute("role", "listitem");
    columnElement.setAttribute("aria-label", `${column.name} column`);

    const columnTitle = document.createElement("h2");
    columnTitle.className = "column-title";
    columnTitle.textContent = column.name;
    columnTitle.style.backgroundColor = getColumnColor(columnIndex);
    columnElement.appendChild(columnTitle);

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks";
    tasksContainer.setAttribute("role", "list");
    tasksContainer.setAttribute("aria-label", `Tasks in ${column.name}`);
    tasksContainer.addEventListener("dragover", (e) => e.preventDefault());
    tasksContainer.addEventListener("drop", (e) => dropTask(e, columnIndex));
    columnElement.appendChild(tasksContainer);

    column.tasks.forEach((task, taskIndex) => {
      const taskElement = document.createElement("div");
      taskElement.className = "task";
      if (task.completed) taskElement.classList.add("done");
      taskElement.draggable = true;
      taskElement.dataset.columnIndex = columnIndex;
      taskElement.dataset.taskIndex = taskIndex;
      taskElement.setAttribute("role", "listitem");
      taskElement.setAttribute("tabindex", "0");
      taskElement.setAttribute(
        "aria-label",
        `${task.text}${task.completed ? " (completed)" : ""}`
      );

      // Add keyboard support for task completion
      taskElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTaskCompletion(columnIndex, taskIndex);
        }
      });

      taskElement.addEventListener("dragstart", dragStart);

      const taskContent = document.createElement("div");
      taskContent.className = "task-content";

      if (task.completed) {
        const checkmark = document.createElement("i");
        checkmark.className = "fas fa-check-circle mr-2";
        checkmark.setAttribute("aria-hidden", "true");
        taskContent.appendChild(checkmark);
      }

      const taskText = document.createElement("span");
      taskText.textContent = task.text;
      taskContent.appendChild(taskText);

      taskElement.appendChild(taskContent);
      taskElement.addEventListener("click", () =>
        toggleTaskCompletion(columnIndex, taskIndex)
      );

      tasksContainer.appendChild(taskElement);
    });

    boardContainer.appendChild(columnElement);
  });

  if (isProgrammaticChange) {
    updateBoardConfigText();
    saveBoardConfig();
    isProgrammaticChange = false;
  }
}

// Update the board configuration text area based on the data model
function updateBoardConfigText() {
  const boardConfigTextarea = document.getElementById("board-config");
  let lines = [];
  lines.push(boardData.name);
  boardData.columns.forEach((column) => {
    lines.push("/ " + column.name);
    column.tasks.forEach((task) => {
      if (task.completed) {
        lines.push("! " + task.text);
      } else {
        lines.push("@ " + task.text);
      }
    });
  });
  boardConfigTextarea.value = lines.join("\n");
}

// Assign automatic colors to columns
function getColumnColor(index) {
  const colors = [
    "#c8b8a8",
    "#a8b8c0",
    "#c0b8c0",
    "#b0c0a8",
    "#c8c0b0",
    "#b0a8c0",
    "#c0c8b8",
    "#a8c0b8",
  ];
  return colors[index % colors.length];
}

// Drag and Drop Functions
function dragStart(event) {
  const columnIndex = event.target.dataset.columnIndex;
  const taskIndex = event.target.dataset.taskIndex;
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({ columnIndex, taskIndex })
  );
}

function dropTask(event, targetColumnIndex) {
  event.preventDefault();
  const data = JSON.parse(event.dataTransfer.getData("text/plain"));
  const { columnIndex, taskIndex } = data;

  const sourceColumnIndex = parseInt(columnIndex);
  const sourceTaskIndex = parseInt(taskIndex);
  targetColumnIndex = parseInt(targetColumnIndex);

  const [movedTask] = boardData.columns[sourceColumnIndex].tasks.splice(
    sourceTaskIndex,
    1
  );
  boardData.columns[targetColumnIndex].tasks.push(movedTask);

  isProgrammaticChange = true;
  renderBoard();
}

function toggleTaskCompletion(columnIndex, taskIndex) {
  const task = boardData.columns[columnIndex].tasks[taskIndex];
  task.completed = !task.completed;
  isProgrammaticChange = true;
  renderBoard();
}

// Save the board configuration to the server
async function saveBoardConfig() {
  const configText = document.getElementById("board-config").value;

  try {
    await fetchAPI(window.location.pathname, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ config: configText }),
    });
  } catch (error) {
    console.error("Failed to save board configuration:", error);
  }
}

// Menu Button Actions
function startNewBoard() {
  if (confirm("Are you sure you want to start a new board?")) {
    window.location.href = "/";
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  } catch {
    alert("Failed to copy link.");
  }
}

async function deleteBoard() {
  if (confirm("Are you sure you want to delete this board?")) {
    try {
      await fetchAPI(window.location.pathname, { method: "DELETE" });
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  }
}

// Setup the splitter for resizing the sidebar
function setupSplitter() {
  const splitter = document.getElementById("splitter");
  const sidebar = document.getElementById("sidebar");
  let isDragging = false;

  splitter.addEventListener("mousedown", function (e) {
    e.preventDefault();
    isDragging = true;
    document.body.style.cursor = "col-resize";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    let newWidth = e.clientX;
    const minWidth = 200;
    const maxWidth = 500;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    sidebar.style.width = newWidth + "px";
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    e.preventDefault();

    isDragging = false;
    document.body.style.cursor = "default";

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }
}

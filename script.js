const API_URL = "https://tasks-api.leefamous.workers.dev";
const API_KEY = window.ENV?.API_KEY || "";

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
      // Show user-friendly error message
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
  if (!API_KEY || API_KEY === "__API_KEY__") {
    console.error("API key is not properly configured");
    throw new Error("API key is not properly configured");
  }

  const headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      throw new Error("Invalid API key");
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

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
  const boardConfigTextarea = document.getElementById("board-config");
  const saveStatus = document.getElementById("save-status");
  saveBoardConfig();
  saveStatus.className = "w-2 h-2 rounded-full bg-yellow-400";
  saveBoardConfig()
    .then(() => {
      saveStatus.className = "w-2 h-2 rounded-full bg-green-400";
    })
    .catch(() => {
      saveStatus.className = "w-2 h-2 rounded-full bg-red-400";
    });
  boardConfigTextarea.addEventListener(
    "input",
    debounce(() => {
      parseBoardConfig();
    }, 500)
  );

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Only handle keyboard shortcuts when not typing in textarea
    if (e.target.tagName === "TEXTAREA") return;

    // Ctrl/Cmd + / to focus config
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      boardConfigTextarea.focus();
    }
    // Ctrl/Cmd + n for new board
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      startNewBoard();
    }
    // Ctrl/Cmd + c to copy link
    if ((e.ctrlKey || e.metaKey) && e.key === "c" && e.shiftKey) {
      e.preventDefault();
      copyLink();
    }
    // Ctrl/Cmd + b to add column
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      document.getElementById("add-column").click();
    }
    // Ctrl/Cmd + t to add task
    if ((e.ctrlKey || e.metaKey) && e.key === "t") {
      e.preventDefault();
      document.getElementById("add-item").click();
    }
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
    } else if (line.startsWith("@") && currentColumn) {
      currentColumn.tasks.push({
        text: line.substring(1).trim(),
        completed: false,
      });
    } else if (
      line.startsWith("completed:") &&
      currentColumn &&
      currentColumn.tasks.length > 0
    ) {
      const lastTask = currentColumn.tasks[currentColumn.tasks.length - 1];
      lastTask.completed = line.includes("true");
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

  boardTitleElement.textContent = boardData.name || "My Kanban Board";
  document.title = boardData.name || "My Kanban Board";

  boardData.columns.forEach((column, columnIndex) => {
    const columnElement = document.createElement("div");
    columnElement.className =
      "min-w-[250px] bg-gray-800 rounded-md mr-4 flex flex-col text-sm h-full";
    columnElement.setAttribute("role", "listitem");
    columnElement.setAttribute("aria-label", `${column.name} column`);

    const columnTitle = document.createElement("h2");
    columnTitle.className =
      "p-3 m-0 rounded-t-md text-center font-bold text-gray-950";
    columnTitle.textContent = column.name;
    columnTitle.style.backgroundColor = getColumnColor(columnIndex);
    columnElement.appendChild(columnTitle);

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "flex-1 p-2 overflow-y-auto bg-gray-800";
    tasksContainer.setAttribute("role", "list");
    tasksContainer.setAttribute("aria-label", `Tasks in ${column.name}`);
    tasksContainer.addEventListener("dragover", dragOver);
    tasksContainer.addEventListener("drop", (e) => dropTask(e, columnIndex));
    columnElement.appendChild(tasksContainer);

    column.tasks.forEach((task, taskIndex) => {
      const taskElement = document.createElement("div");
      taskElement.className = `bg-gray-900 p-2 mb-2 cursor-grab rounded shadow-md transition-colors hover:bg-gray-700 ${
        task.completed
          ? "bg-green-400 bg-opacity-20 text-gray-950"
          : "text-gray-100"
      }`;
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
      taskContent.className = "flex items-center";

      if (task.completed) {
        const checkmark = document.createElement("i");
        checkmark.className = "fas fa-check-circle mr-2 text-gray-950";
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
      lines.push("@ " + task.text);
      if (task.completed) {
        lines.push("completed: true");
      }
    });
  });
  boardConfigTextarea.value = lines.join("\n");
}

// Assign automatic colors to columns
function getColumnColor(index) {
  const colors = [
    "rgb(248 113 113)", // red-400
    "rgb(251 146 60)", // orange-400
    "rgb(250 204 21)", // yellow-400
    "rgb(74 222 128)", // green-400
    "rgb(96 165 250)", // blue-400
    "rgb(192 132 252)", // purple-400
    "rgb(244 114 182)", // pink-400
    "rgb(45 212 191)", // teal-400
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

function dragOver(event) {
  event.preventDefault();
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
  const saveStatus = document.getElementById("save-status");

  try {
    await fetchAPI(window.location.pathname, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ config: configText }),
    });
    saveStatus.className = "w-2 h-2 rounded-full bg-green-400";
  } catch (error) {
    console.error("Failed to save board configuration:", error);
    saveStatus.className = "w-2 h-2 rounded-full bg-red-400";
    throw error;
  }
}

// Menu Button Actions
function startNewBoard() {
  if (confirm("Are you sure you want to start a new board?")) {
    window.location.href = "/";
  }
}

function copyLink() {
  const shareableLink = window.location.href;
  navigator.clipboard.writeText(shareableLink).then(
    () => {
      alert("Link copied to clipboard!");
    },
    () => {
      alert("Failed to copy link.");
    }
  );
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

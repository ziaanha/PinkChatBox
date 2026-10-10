
const $ = (selector) => document.querySelector(selector);

const app = $(".app");
const chatList = $("#chat-list");
const messagesEl = $("#messages");
const messageInput = $("#message-input");
const messageForm = $("#message-form");
const toastEl = $("#toast");

const palette = [
  ["#b64c87", "#633c78"],
  ["#d06b8d", "#7d456e"],
  ["#a653a0", "#593d85"],
  ["#bd6b77", "#71445f"],
  ["#ad6590", "#644879"],
  ["#c16d9f", "#774b84"]
];

const initialChats = [
  {
    id: 1,
    name: "Mia Rose",
    initial: "M",
    online: true,
    unread: 0,
    about: "Your favorite person to share little moments with.",
    messages: [
      { from: "them", text: "Hiii Zia!! 💗", time: "10:21 AM" },
      { from: "them", text: "How has your day been going?", time: "10:21 AM" },
      { from: "me", text: "Pretty good! Just working on my new project ✨", time: "10:22 AM" },
      { from: "them", text: "Ooooh tell me more!!", time: "10:23 AM" }
    ]
  },
  {
    id: 2,
    name: "Alex Morgan",
    initial: "A",
    online: true,
    unread: 2,
    about: "Always here for a good conversation.",
    messages: [
      { from: "them", text: "Hey! Did you finish that playlist?", time: "9:45 AM" },
      { from: "them", text: "Send it to me when you can 🎧", time: "9:46 AM" }
    ]
  },
  {
    id: 3,
    name: "Luna Belle",
    initial: "L",
    online: false,
    unread: 0,
    about: "A little sunshine on cloudy days. 🌷",
    messages: [
      { from: "me", text: "We should watch a movie this weekend!", time: "Yesterday" },
      { from: "them", text: "YESSS absolutely!! 🍿", time: "Yesterday" }
    ]
  },
  {
    id: 4,
    name: "Noah James",
    initial: "N",
    online: true,
    unread: 1,
    about: "Let's talk about everything and nothing.",
    messages: [
      { from: "them", text: "Have you listened to the new album?", time: "Yesterday" }
    ]
  },
  {
    id: 5,
    name: "Sophie Lane",
    initial: "S",
    online: false,
    unread: 0,
    about: "Collecting memories, one conversation at a time.",
    messages: [
      { from: "them", text: "That photo you sent was so pretty! 💕", time: "Monday" }
    ]
  },
  {
    id: 6,
    name: "Kai Bennett",
    initial: "K",
    online: false,
    unread: 0,
    about: "For random thoughts and late-night chats.",
    messages: [
      { from: "me", text: "I have a new coding idea.", time: "Monday" },
      { from: "them", text: "I'm listening 👀", time: "Monday" }
    ]
  }
];

let chats = loadChats();
let activeChatId = chats[0]?.id ?? null;
let activeFilter = "all";
let chatSearch = "";
let messageSearch = "";
let nextId = Math.max(0, ...chats.map(chat => chat.id)) + 1;
let toastTimer;
let selectedFiles = new Map();

function loadChats() {
  try {
    const saved = localStorage.getItem("pinkchat-chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Couldn't load saved chats.", error);
  }

  return initialChats.map(chat => ({
    ...chat,
    messages: chat.messages.map(message => ({ ...message }))
  }));
}

function saveChats() {
  try {
    localStorage.setItem("pinkchat-chats", JSON.stringify(chats));
  } catch (error) {
    showToast("Couldn't save changes in this browser.");
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function avatarStyle(id) {
  const colors = palette[Math.abs(Number(id) || 0) % palette.length];
  return `background:linear-gradient(140deg,${colors[0]},${colors[1]})`;
}

function getActiveChat() {
  return chats.find(chat => chat.id === activeChatId);
}

function currentTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getLastMessage(chat) {
  return chat.messages[chat.messages.length - 1];
}

function getPreview(chat) {
  const last = getLastMessage(chat);
  if (!last) return "Start a conversation...";

  if (last.fileName) return "📎 " + last.fileName;
  if (last.imageData) return "📷 Photo";
  return last.text || "New message";
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

function renderChatList() {
  const filtered = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(
      chatSearch.toLowerCase()
    );

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "unread" && chat.unread > 0) ||
      (activeFilter === "online" && chat.online);

    return matchesSearch && matchesFilter;
  });

  if (!filtered.length) {
    chatList.innerHTML = `
      <div class="empty-list">
        No conversations found.<br>
        Try another search or start a new chat ♡
      </div>`;
    return;
  }

  chatList.innerHTML = filtered.map(chat => {
    const last = getLastMessage(chat);
    const time = last?.time || "";
    const preview = getPreview(chat);

    return `
      <button class="chat-item ${chat.id === activeChatId ? "active" : ""}"
        data-chat-id="${chat.id}">
        <div class="avatar" style="${avatarStyle(chat.id)}">
          ${escapeHTML(chat.initial || chat.name.charAt(0).toUpperCase())}
        </div>

        <div class="chat-person">
          <strong>${escapeHTML(chat.name)}</strong>
          <p>${chat.online ? '<i class="online-dot"></i>' : ""}
            ${escapeHTML(preview)}
          </p>
        </div>

        <div class="chat-meta">
          <span class="chat-time">${escapeHTML(time)}</span>
          ${chat.unread > 0
            ? `<span class="unread-count">${chat.unread}</span>`
            : ""}
        </div>
      </button>`;
  }).join("");
}

function highlightText(text, query) {
  const safeText = escapeHTML(text);

  if (!query) return safeText;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");

  return safeText.replace(regex, "<mark>$1</mark>");
}

function renderMessages() {
  const chat = getActiveChat();

  if (!chat) {
    messagesEl.innerHTML = `
      <div class="welcome-note">
        <span>♡</span>
        <p>Choose a conversation to get started.</p>
      </div>`;
    return;
  }

  const filteredMessages = chat.messages
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => {
      if (!messageSearch) return true;

      const content = [
        message.text,
        message.fileName
      ].join(" ").toLowerCase();

      return content.includes(messageSearch.toLowerCase());
    });

  let html = `
    <div class="welcome-note">
      <span>♡</span>
      <p>This is your little corner with ${escapeHTML(chat.name)}.</p>
    </div>
    <div class="day-divider">TODAY · A LITTLE MORE CONNECTION</div>`;

  if (!filteredMessages.length) {
    html += `
      <div class="empty-list">
        No matching messages found.
      </div>`;
  }

  filteredMessages.forEach(({ message, index }) => {
    const mine = message.from === "me";
    const name = mine ? "You" : chat.name;

    html += `
      <div class="message-row ${mine ? "mine" : ""}">
        ${!mine ? `
          <div class="avatar message-avatar"
            style="${avatarStyle(chat.id)}">
            ${escapeHTML(chat.initial)}
          </div>` : ""}

        <div class="message-content">
          <div class="message-sender">${escapeHTML(name)}</div>
          <div class="bubble">`;

    if (message.text) {
      html += `<div>${highlightText(message.text, messageSearch)}</div>`;
    }

    if (message.imageData) {
      html += `
        <img class="message-image"
          src="${message.imageData}"
          alt="Attached image">`;
    }

    if (message.fileName) {
      html += `
        <a class="file-message"
          href="${message.fileData || "#"}"
          ${message.fileData ? 'download="' + escapeHTML(message.fileName) + '"' : ""}
          ${message.fileData ? "" : 'aria-disabled="true"'}
          data-file-index="${index}">
          📎 ${escapeHTML(message.fileName)}
        </a>`;
    }

    html += `
          </div>
          <div class="message-time">
            ${escapeHTML(message.time || "")}
            ${mine ? " · ✓" : ""}
          </div>
        </div>
      </div>`;
  });

  messagesEl.innerHTML = html;

  if (!messageSearch) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } else {
    const firstMatch = messagesEl.querySelector("mark");
    firstMatch?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function renderHeader() {
  const chat = getActiveChat();
  if (!chat) return;

  $("#header-name").textContent = chat.name;
  $("#header-avatar").textContent = chat.initial;
  $("#header-avatar").style = avatarStyle(chat.id);

  $("#header-status").innerHTML = chat.online
    ? '<i class="online-dot"></i> Online'
    : "Offline";

  $("#details-avatar").textContent = chat.initial;
  $("#details-avatar").style = avatarStyle(chat.id);
  $("#details-name").textContent = chat.name;
  $("#details-status").textContent = chat.online ? "Online" : "Offline";
  $("#details-description").textContent =
    chat.about || "A little space for lovely conversations.";

  const files = chat.messages.filter(
    message => message.fileName || message.imageData
  );

  $("#shared-files").innerHTML = files.length
    ? files.map(file => `
        <div style="padding:6px 0">
          ${file.imageData ? "📷" : "📎"}
          ${escapeHTML(file.fileName || "Shared image")}
        </div>`).join("")
    : "No files shared yet.";
}

function renderAll() {
  renderChatList();
  renderHeader();
  renderMessages();
}

function selectChat(id) {
  activeChatId = id;

  const chat = getActiveChat();
  if (!chat) return;

  chat.unread = 0;
  messageSearch = "";
  $("#message-search-input").value = "";
  $("#message-search").classList.add("hidden");
  $("#details-panel").classList.add("hidden");
  $("#emoji-picker").classList.add("hidden");

  renderAll();
  saveChats();
  messageInput.focus();

  if (window.innerWidth <= 520) {
    app.classList.add("chat-open");
  }
}

function sendMessage(text, file = null) {
  const chat = getActiveChat();

  if (!chat) {
    showToast("Start a chat first!");
    return;
  }

  if (!text.trim() && !file) return;

  const message = {
    from: "me",
    text: text.trim(),
    time: currentTime()
  };

  if (file) {
    message.fileName = file.name;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = () => {
        message.imageData = reader.result;
        chat.messages.push(message);
        chat.online = chat.online;
        renderAll();
        saveChats();
      };

      reader.onerror = () => {
        showToast("Couldn't read this image.");
      };

      reader.readAsDataURL(file);
      return;
    }

    if (file.size > 500 * 1024) {
      showToast("For this demo, files must be 500 KB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      message.fileData = reader.result;
      chat.messages.push(message);
      renderAll();
      saveChats();
    };

    reader.onerror = () => showToast("Couldn't read this file.");
    reader.readAsDataURL(file);
    return;
  }

  chat.messages.push(message);
  chat.unread = 0;

  renderAll();
  saveChats();
}

function createNewChat() {
  const name = prompt("What's your friend's name?");

  if (name === null) return;

  const cleanName = name.trim();

  if (!cleanName) {
    showToast("Please enter a name.");
    return;
  }

  if (cleanName.length > 40) {
    showToast("Please use a shorter name.");
    return;
  }

  const existing = chats.find(
    chat => chat.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (existing) {
    selectChat(existing.id);
    showToast("That conversation already exists!");
    return;
  }

  const newChat = {
    id: nextId++,
    name: cleanName,
    initial: cleanName.charAt(0).toUpperCase(),
    online: false,
    unread: 0,
    about: "A new little space for conversation.",
    messages: []
  };

  chats.unshift(newChat);
  chatSearch = "";
  $("#chat-search").value = "";
  activeFilter = "all";

  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  selectChat(newChat.id);
  showToast("New conversation created ♡");
}

function clearConversation() {
  const chat = getActiveChat();
  if (!chat) return;

  const confirmed = confirm(
    `Clear the conversation with ${chat.name}? This cannot be undone.`
  );

  if (!confirmed) return;

  chat.messages = [];
  chat.unread = 0;

  renderAll();
  saveChats();
  showToast("Conversation cleared.");
}

// Chat list interactions
chatList.addEventListener("click", event => {
  const button = event.target.closest("[data-chat-id]");
  if (button) selectChat(Number(button.dataset.chatId));
});

$("#chat-search").addEventListener("input", event => {
  chatSearch = event.target.value.trim();
  renderChatList();
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderChatList();
  });
});

$("#new-chat-btn").addEventListener("click", createNewChat);

// Send messages
messageForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = messageInput.value;
  if (!text.trim()) return;

  sendMessage(text);
  messageInput.value = "";
  messageInput.style.height = "auto";
  messageInput.focus();
});

messageInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    messageForm.requestSubmit();
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 120) + "px";
});

// Emoji picker
$("#emoji-btn").addEventListener("click", () => {
  $("#emoji-picker").classList.toggle("hidden");
});

$("#emoji-picker").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  const start = messageInput.selectionStart;
  const end = messageInput.selectionEnd;
  const value = messageInput.value;
  const emoji = button.textContent;

  messageInput.value =
    value.slice(0, start) + emoji + value.slice(end);

  const position = start + emoji.length;
  messageInput.focus();
  messageInput.setSelectionRange(position, position);
  messageInput.dispatchEvent(new Event("input"));

  $("#emoji-picker").classList.add("hidden");
});

document.addEventListener("click", event => {
  if (
    !event.target.closest("#emoji-picker") &&
    !event.target.closest("#emoji-btn")
  ) {
    $("#emoji-picker").classList.add("hidden");
  }
});

// File attachments
$("#attach-btn").addEventListener("click", () => {
  $("#file-input").click();
});

$("#file-input").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 500 * 1024) {
    showToast("Choose a file smaller than 500 KB.");
    event.target.value = "";
    return;
  }

  sendMessage("", file);
  event.target.value = "";
});

// Search within the active conversation
$("#search-message-btn").addEventListener("click", () => {
  $("#message-search").classList.toggle("hidden");

  if (!$("#message-search").classList.contains("hidden")) {
    $("#message-search-input").focus();
  } else {
    messageSearch = "";
    renderMessages();
  }
});

$("#message-search-input").addEventListener("input", event => {
  messageSearch = event.target.value.trim();
  renderMessages();
});

$("#close-message-search").addEventListener("click", () => {
  messageSearch = "";
  $("#message-search-input").value = "";
  $("#message-search").classList.add("hidden");
  renderMessages();
});

// Chat details
$("#details-btn").addEventListener("click", () => {
  $("#details-panel").classList.toggle("hidden");
  renderHeader();
});

$("#close-details").addEventListener("click", () => {
  $("#details-panel").classList.add("hidden");
});

$("#clear-chat-btn").addEventListener("click", clearConversation);

$("#settings-btn").addEventListener("click", () => {
  showToast("Welcome to PinkChat, Zia! ♡");
});

// Small-screen back navigation
const backButton = document.createElement("button");
backButton.className = "icon-button";
backButton.textContent = "←";
backButton.title = "Back to conversations";
backButton.setAttribute("aria-label", "Back to conversations");
backButton.style.display = "none";

$(".header-person").prepend(backButton);

function updateBackButton() {
  backButton.style.display =
    window.innerWidth <= 520 ? "grid" : "none";
}

backButton.addEventListener("click", () => {
  app.classList.remove("chat-open");
});

window.addEventListener("resize", updateBackButton);

// Initial setup
updateBackButton();
renderAll();



/* ===== PINKCHAT AUTHENTICATION ===== */

const authScreen = document.querySelector("#auth-screen");
const chatApp = document.querySelector("#chat-app");
const authForm = document.querySelector("#auth-form");
const authHeading = document.querySelector("#auth-heading");
const authDescription = document.querySelector("#auth-description");
const authSubmit = document.querySelector("#auth-submit");
const authToggle = document.querySelector("#auth-toggle");
const authError = document.querySelector("#auth-error");
const authEmail = document.querySelector("#auth-email");
const authPassword = document.querySelector("#auth-password");

let isCreatingAccount = false;
let authBusy = false;

function showAuthError(message) {
  authError.textContent = message;
}

function setAuthMode(createAccount) {
  isCreatingAccount = createAccount;
  authForm.reset();
  showAuthError("");

  authHeading.textContent = createAccount
    ? "Create your account 💗"
    : "Welcome back 💗";

  authDescription.textContent = createAccount
    ? "Make a little corner of your own."
    : "Sign in to your little corner.";

  authSubmit.textContent = createAccount
    ? "Create account"
    : "Sign in";

  authToggle.textContent = createAccount
    ? "Sign in"
    : "Create account";

  authPassword.autocomplete = createAccount
    ? "new-password"
    : "current-password";
}

function showSignedInApp(user) {
  authScreen.style.display = "none";
  chatApp.style.display = "grid";

  const emailName = user.email?.split("@")[0] || "PinkChat user";
  const displayName =
    user.user_metadata?.display_name || emailName;

  // Update the sidebar's profile name if its element exists.
  const profileName = document.querySelector(
    ".profile-name, #profile-name"
  );

  if (profileName) {
    profileName.textContent = displayName;
  }

  const profileEmail = document.querySelector("#profile-email");

  if (profileEmail) {
    profileEmail.textContent = user.email || "";
  }

  // Use the current demo UI for now.
  renderAll();

  // Check the database only after authentication.
  testPinkChatConnection();
}

function showSignedOutScreen() {
  chatApp.style.display = "none";
  authScreen.style.display = "flex";
  showAuthError("");
}

authToggle.addEventListener("click", () => {
  setAuthMode(!isCreatingAccount);
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (authBusy) return;

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!window.pinkchatSupabase) {
    showAuthError("Supabase isn't connected. Check supabase-client.js.");
    return;
  }

  authBusy = true;
  authSubmit.disabled = true;
  authSubmit.textContent = isCreatingAccount
    ? "Creating account..."
    : "Signing in...";

  showAuthError("");

  try {
    let result;

    if (isCreatingAccount) {
      const displayName = email.split("@")[0];

      result = await window.pinkchatSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
    } else {
      result = await window.pinkchatSupabase.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) {
      throw result.error;
    }

    if (isCreatingAccount && !result.data.session) {
      showAuthError(
        "Account created! Check your email for a confirmation link, then sign in."
      );
      return;
    }

    if (result.data.user && result.data.session) {
      showSignedInApp(result.data.user);
    }
  } catch (error) {
    console.error("PinkChat authentication error:", error);

    showAuthError(
      error.message || "Something went wrong. Please try again."
    );
  } finally {
    authBusy = false;
    authSubmit.disabled = false;
    authSubmit.textContent = isCreatingAccount
      ? "Create account"
      : "Sign in";
  }
});

// Sign out when the existing settings button is clicked.
$("#settings-btn").addEventListener("click", async () => {
  const confirmed = confirm("Sign out of PinkChat?");

  if (!confirmed) return;

  const { error } = await window.pinkchatSupabase.auth.signOut();

  if (error) {
    console.error("Sign-out error:", error);
    showToast("Couldn't sign out. Please try again.");
  }
});

// Restore the session after a page refresh and respond to sign-in/out.
window.pinkchatSupabase.auth.onAuthStateChange(
  (event, session) => {
    if (session?.user) {
      showSignedInApp(session.user);
    } else {
      showSignedOutScreen();
    }
  }
);

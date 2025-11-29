import { createClient } from '@supabase/supabase-js';
import { renderMarkdown } from './utils/markdown.js';
import { saveTemplate, getTemplates, deleteTemplate, exportChatAsJSON, exportChatAsTXT } from './utils/storage.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let currentChatId = null;
let messageHistory = [];
let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
let allChats = [];
let selectedChatForMenu = null;
let currentStreamController = null;

const elements = {
  welcomeScreen: document.getElementById('welcomeScreen'),
  messages: document.getElementById('messages'),
  userInput: document.getElementById('userInput'),
  sendBtn: document.getElementById('sendBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  chatHistory: document.getElementById('chatHistory'),
  menuToggle: document.getElementById('menuToggle'),
  themeToggle: document.getElementById('themeToggle'),
  chatContainer: document.getElementById('chatContainer'),
  searchInput: document.getElementById('searchInput'),
  templatesBtn: document.getElementById('templatesBtn'),
  exportBtn: document.getElementById('exportBtn'),
  templatesModal: document.getElementById('templatesModal'),
  addTemplateModal: document.getElementById('addTemplateModal'),
  exportModal: document.getElementById('exportModal'),
  contextMenu: document.getElementById('contextMenu')
};

function initTheme() {
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.themeToggle.querySelector('.sun-icon').classList.add('hidden');
    elements.themeToggle.querySelector('.moon-icon').classList.remove('hidden');
  }
}

elements.themeToggle.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  elements.themeToggle.querySelector('.sun-icon').classList.toggle('hidden');
  elements.themeToggle.querySelector('.moon-icon').classList.toggle('hidden');
});

elements.menuToggle.addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

elements.newChatBtn.addEventListener('click', startNewChat);

elements.userInput.addEventListener('input', () => {
  elements.sendBtn.disabled = !elements.userInput.value.trim();
  elements.userInput.style.height = 'auto';
  elements.userInput.style.height = elements.userInput.scrollHeight + 'px';
});

elements.userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

elements.sendBtn.addEventListener('click', sendMessage);

document.querySelectorAll('.suggestion-card').forEach(card => {
  card.addEventListener('click', () => {
    const prompt = card.dataset.prompt;
    elements.userInput.value = prompt;
    elements.sendBtn.disabled = false;
    sendMessage();
  });
});

elements.searchInput.addEventListener('input', (e) => {
  filterChatHistory(e.target.value);
});

elements.templatesBtn.addEventListener('click', () => {
  openTemplatesModal();
});

elements.exportBtn.addEventListener('click', () => {
  if (!currentChatId) {
    alert('Tidak ada chat yang aktif untuk di-export');
    return;
  }
  elements.exportModal.classList.add('active');
});

document.getElementById('closeTemplatesModal').addEventListener('click', () => {
  elements.templatesModal.classList.remove('active');
});

document.getElementById('closeAddTemplateModal').addEventListener('click', () => {
  elements.addTemplateModal.classList.remove('active');
});

document.getElementById('closeExportModal').addEventListener('click', () => {
  elements.exportModal.classList.remove('active');
});

document.getElementById('addTemplateBtn').addEventListener('click', () => {
  elements.addTemplateModal.classList.add('active');
});

document.getElementById('cancelAddTemplate').addEventListener('click', () => {
  elements.addTemplateModal.classList.remove('active');
});

document.getElementById('saveTemplate').addEventListener('click', () => {
  const name = document.getElementById('templateName').value.trim();
  const content = document.getElementById('templateContent').value.trim();

  if (!name || !content) {
    alert('Nama dan prompt harus diisi');
    return;
  }

  saveTemplate(name, content);
  document.getElementById('templateName').value = '';
  document.getElementById('templateContent').value = '';
  elements.addTemplateModal.classList.remove('active');
  openTemplatesModal();
});

document.getElementById('exportJSON').addEventListener('click', async () => {
  const chat = allChats.find(c => c.id === currentChatId);
  if (chat) {
    exportChatAsJSON(chat);
    elements.exportModal.classList.remove('active');
  }
});

document.getElementById('exportTXT').addEventListener('click', async () => {
  const chat = allChats.find(c => c.id === currentChatId);
  if (chat) {
    exportChatAsTXT(chat);
    elements.exportModal.classList.remove('active');
  }
});

document.addEventListener('click', (e) => {
  if (!elements.contextMenu.contains(e.target)) {
    elements.contextMenu.classList.remove('active');
  }
});

document.getElementById('renameChat').addEventListener('click', async () => {
  if (!selectedChatForMenu) return;

  const newTitle = prompt('Nama chat baru:', selectedChatForMenu.title);
  if (newTitle && newTitle.trim()) {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle.trim() })
        .eq('id', selectedChatForMenu.id);

      if (error) throw error;
      await loadChatHistory();
    } catch (error) {
      console.error('Error renaming chat:', error);
      alert('Gagal rename chat');
    }
  }
  elements.contextMenu.classList.remove('active');
});

document.getElementById('deleteChat').addEventListener('click', async () => {
  if (!selectedChatForMenu) return;

  if (confirm('Yakin ingin menghapus chat ini?')) {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', selectedChatForMenu.id);

      if (error) throw error;

      if (currentChatId === selectedChatForMenu.id) {
        startNewChat();
      }
      await loadChatHistory();
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Gagal menghapus chat');
    }
  }
  elements.contextMenu.classList.remove('active');
});

function openTemplatesModal() {
  const templates = getTemplates();
  const templatesList = document.getElementById('templatesList');

  if (templates.length === 0) {
    templatesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Belum ada template</p>';
  } else {
    templatesList.innerHTML = templates.map(t => `
      <div class="template-item" data-id="${t.id}">
        <div class="template-name">${t.name}</div>
        <div class="template-content">${t.content}</div>
        <div class="template-actions">
          <button class="action-btn use-template">Gunakan</button>
          <button class="action-btn delete-template">Hapus</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.use-template').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        elements.userInput.value = templates[idx].content;
        elements.sendBtn.disabled = false;
        elements.templatesModal.classList.remove('active');
      });
    });

    document.querySelectorAll('.delete-template').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        if (confirm('Hapus template ini?')) {
          deleteTemplate(templates[idx].id);
          openTemplatesModal();
        }
      });
    });
  }

  elements.templatesModal.classList.add('active');
}

function filterChatHistory(query) {
  const filtered = query
    ? allChats.filter(chat => chat.title.toLowerCase().includes(query.toLowerCase()))
    : allChats;

  renderChatHistory(filtered);
}

function renderChatHistory(chats) {
  elements.chatHistory.innerHTML = '';
  chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (chat.id === currentChatId) {
      item.classList.add('active');
    }
    item.textContent = chat.title;
    item.onclick = () => loadChat(chat);

    item.oncontextmenu = (e) => {
      e.preventDefault();
      selectedChatForMenu = chat;
      elements.contextMenu.style.left = e.pageX + 'px';
      elements.contextMenu.style.top = e.pageY + 'px';
      elements.contextMenu.classList.add('active');
    };

    elements.chatHistory.appendChild(item);
  });
}

function startNewChat() {
  if (currentStreamController) {
    currentStreamController.abort();
    currentStreamController = null;
  }
  currentChatId = null;
  messageHistory = [];
  elements.messages.innerHTML = '';
  elements.welcomeScreen.style.display = 'flex';
  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.remove('active');
  });
}

async function sendMessage(regenerate = false) {
  let text = elements.userInput.value.trim();

  if (regenerate && messageHistory.length > 0) {
    messageHistory.pop();
    const lastMessage = elements.messages.lastChild;
    if (lastMessage && lastMessage.classList.contains('bot')) {
      lastMessage.remove();
    }
  } else if (!text) {
    return;
  }

  if (!currentChatId) {
    currentChatId = crypto.randomUUID();
    elements.welcomeScreen.style.display = 'none';
  }

  if (!regenerate) {
    addMessage(text, 'user');
    messageHistory.push({ role: 'user', content: text });
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
  }

  elements.sendBtn.disabled = true;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = '🤖';

  const content = document.createElement('div');
  content.className = 'message-content';

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  elements.messages.appendChild(messageDiv);

  currentStreamController = new AbortController();

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        messages: messageHistory,
        chatId: currentChatId,
        stream: true
      }),
      signal: currentStreamController.signal
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullText += parsed.content;
              content.innerHTML = renderMarkdown(fullText);
              elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    }

    if (fullText) {
      messageHistory.push({ role: 'assistant', content: fullText });
      addMessageActions(messageDiv);
      await saveChatToSupabase();
      await loadChatHistory();
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream aborted');
    } else {
      console.error('Error:', error);
      content.textContent = 'Maaf, tidak dapat terhubung ke server. Silakan coba lagi.';
    }
  } finally {
    elements.sendBtn.disabled = false;
    currentStreamController = null;
  }
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = sender === 'user' ? '👤' : '🤖';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'message-content-wrapper';

  const content = document.createElement('div');
  content.className = 'message-content';

  if (sender === 'bot') {
    content.innerHTML = renderMarkdown(text);
  } else {
    content.textContent = text;
  }

  contentWrapper.appendChild(content);

  if (sender === 'bot') {
    const actions = createMessageActions(messageDiv);
    contentWrapper.appendChild(actions);
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentWrapper);

  elements.messages.appendChild(messageDiv);
  elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

function createMessageActions(messageDiv) {
  const actions = document.createElement('div');
  actions.className = 'message-actions';

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'action-btn';
  copyBtn.title = 'Copy';
  copyBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
  copyBtn.onclick = () => {
    const content = messageDiv.querySelector('.message-content');
    navigator.clipboard.writeText(content.textContent);
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    setTimeout(() => {
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
    }, 2000);
  };

  // Like button
  const likeBtn = document.createElement('button');
  likeBtn.className = 'action-btn';
  likeBtn.title = 'Good response';
  likeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </svg>
  `;

  // Dislike button
  const dislikeBtn = document.createElement('button');
  dislikeBtn.className = 'action-btn';
  dislikeBtn.title = 'Bad response';
  dislikeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
    </svg>
  `;

  // Share button
  const shareBtn = document.createElement('button');
  shareBtn.className = 'action-btn';
  shareBtn.title = 'Share';
  shareBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
      <polyline points="16 6 12 2 8 6"></polyline>
      <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
  `;

  // Regenerate button
  const regenerateBtn = document.createElement('button');
  regenerateBtn.className = 'action-btn';
  regenerateBtn.title = 'Regenerate';
  regenerateBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
    </svg>
  `;
  regenerateBtn.onclick = () => sendMessage(true);

  // More button
  const moreBtn = document.createElement('button');
  moreBtn.className = 'action-btn';
  moreBtn.title = 'More';
  moreBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>
  `;

  actions.appendChild(copyBtn);
  actions.appendChild(likeBtn);
  actions.appendChild(dislikeBtn);
  actions.appendChild(shareBtn);
  actions.appendChild(regenerateBtn);
  actions.appendChild(moreBtn);

  return actions;
}

async function saveChatToSupabase() {
  if (!currentChatId || messageHistory.length === 0) return;

  try {
    const firstUserMessage = messageHistory.find(m => m.role === 'user')?.content || 'New Chat';
    const title = firstUserMessage.substring(0, 50);

    const { error } = await supabase
      .from('chats')
      .upsert({
        id: currentChatId,
        title: title,
        messages: messageHistory,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving chat:', error);
  }
}

async function loadChatHistory() {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    allChats = data;
    renderChatHistory(data);
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

async function loadChat(chat) {
  if (currentStreamController) {
    currentStreamController.abort();
    currentStreamController = null;
  }

  currentChatId = chat.id;
  messageHistory = chat.messages || [];
  elements.messages.innerHTML = '';
  elements.welcomeScreen.style.display = 'none';

  messageHistory.forEach(msg => {
    addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot');
  });

  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.classList.add('active');
}

initTheme();
loadChatHistory();

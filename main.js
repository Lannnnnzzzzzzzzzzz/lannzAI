import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let currentChatId = null;
let messageHistory = [];
let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

const elements = {
  welcomeScreen: document.getElementById('welcomeScreen'),
  messages: document.getElementById('messages'),
  userInput: document.getElementById('userInput'),
  sendBtn: document.getElementById('sendBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  chatHistory: document.getElementById('chatHistory'),
  menuToggle: document.getElementById('menuToggle'),
  themeToggle: document.getElementById('themeToggle'),
  chatContainer: document.getElementById('chatContainer')
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

function startNewChat() {
  currentChatId = null;
  messageHistory = [];
  elements.messages.innerHTML = '';
  elements.welcomeScreen.style.display = 'flex';
  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.remove('active');
  });
}

async function sendMessage() {
  const text = elements.userInput.value.trim();
  if (!text) return;

  if (!currentChatId) {
    currentChatId = crypto.randomUUID();
    elements.welcomeScreen.style.display = 'none';
  }

  addMessage(text, 'user');
  messageHistory.push({ role: 'user', content: text });

  elements.userInput.value = '';
  elements.userInput.style.height = 'auto';
  elements.sendBtn.disabled = true;

  const typingIndicator = showTypingIndicator();

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        messages: messageHistory,
        chatId: currentChatId
      })
    });

    const data = await response.json();
    typingIndicator.remove();

    if (data.reply) {
      addMessage(data.reply, 'bot');
      messageHistory.push({ role: 'assistant', content: data.reply });
      await saveChatToSupabase();
      await loadChatHistory();
    } else {
      addMessage('Maaf, terjadi kesalahan. Silakan coba lagi.', 'bot');
    }
  } catch (error) {
    console.error('Error:', error);
    typingIndicator.remove();
    addMessage('Maaf, tidak dapat terhubung ke server. Silakan coba lagi.', 'bot');
  }
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = sender === 'user' ? '👤' : '🤖';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = text;

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  elements.messages.appendChild(messageDiv);

  elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

function showTypingIndicator() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = '🤖';

  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(typingDiv);
  elements.messages.appendChild(messageDiv);

  elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;

  return messageDiv;
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
      .limit(20);

    if (error) throw error;

    elements.chatHistory.innerHTML = '';
    data.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'history-item';
      if (chat.id === currentChatId) {
        item.classList.add('active');
      }
      item.textContent = chat.title;
      item.onclick = () => loadChat(chat);
      elements.chatHistory.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

async function loadChat(chat) {
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

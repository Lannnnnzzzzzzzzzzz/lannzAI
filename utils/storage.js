const TEMPLATES_KEY = 'lannzai_prompt_templates';

export function saveTemplate(name, content) {
  const templates = getTemplates();
  templates.push({
    id: crypto.randomUUID(),
    name,
    content,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return templates;
}

export function getTemplates() {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteTemplate(id) {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return templates;
}

export function exportChatAsJSON(chat) {
  const dataStr = JSON.stringify(chat, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = `lannzai-chat-${chat.id}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

export function exportChatAsTXT(chat) {
  let text = `LannZAi Chat Export\n`;
  text += `Title: ${chat.title}\n`;
  text += `Date: ${new Date(chat.created_at).toLocaleString()}\n`;
  text += `\n${'='.repeat(50)}\n\n`;

  chat.messages.forEach(msg => {
    const sender = msg.role === 'user' ? 'You' : 'LannZAi';
    text += `${sender}:\n${msg.content}\n\n`;
  });

  const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  const exportFileDefaultName = `lannzai-chat-${chat.id}.txt`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

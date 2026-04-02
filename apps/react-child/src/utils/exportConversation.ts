import type { Conversation } from '../types/chat';

export function exportAsJSON(conversation: Conversation): void {
  const data = JSON.stringify(conversation, null, 2);
  downloadFile(data, `${conversation.title}.json`, 'application/json');
}

export function exportAsMarkdown(conversation: Conversation): void {
  const lines: string[] = [`# ${conversation.title}\n`];
  for (const msg of conversation.messages) {
    const role = msg.role === 'user' ? '**You**' : '**Assistant**';
    lines.push(`${role}:\n\n${msg.content}\n\n---\n`);
  }
  downloadFile(lines.join('\n'), `${conversation.title}.md`, 'text/markdown');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

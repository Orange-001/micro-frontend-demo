const failures = [];

function fail(message) {
  failures.push(message);
}

function parseSSEEvent(event) {
  const lines = event.split('\n');
  let data = '';
  let eventType = 'message';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      data = line.slice(6);
    } else if (line.startsWith('event: ')) {
      eventType = line.slice(7);
    }
  }

  if (data === '[DONE]') return { type: 'done', content: '' };
  if (eventType === 'error') return { type: 'error', content: data };
  if (!data) return null;

  if (data.startsWith('{')) {
    try {
      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta;
      if (!delta) return null;
      const reasoning = delta.reasoning_content ?? delta.reasoning;
      if (reasoning) return { type: 'reasoning', content: reasoning };
      if (delta.content) return { type: 'text', content: delta.content };
      return null;
    } catch {
      return { type: 'text', content: data };
    }
  }

  return { type: 'text', content: data };
}

function parseFragments(fragments) {
  let buffer = '';
  const chunks = [];

  for (const fragment of fragments) {
    buffer += fragment;
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      if (!event.trim()) continue;
      const chunk = parseSSEEvent(event);
      if (chunk) chunks.push(chunk);
    }
  }

  if (buffer.trim()) {
    const chunk = parseSSEEvent(buffer);
    if (chunk) chunks.push(chunk);
  }

  return chunks;
}

function assertEqual(name, actual, expected) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    fail(`${name}: expected ${expectedText}, got ${actualText}`);
  }
}

assertEqual('plain text', parseSSEEvent('data: hello'), { type: 'text', content: 'hello' });
assertEqual('done event', parseSSEEvent('data: [DONE]'), { type: 'done', content: '' });
assertEqual('error event', parseSSEEvent('event: error\ndata: failed'), {
  type: 'error',
  content: 'failed',
});
assertEqual('openai delta', parseSSEEvent('data: {"choices":[{"delta":{"content":"hi"}}]}'), {
  type: 'text',
  content: 'hi',
});
assertEqual(
  'reasoning delta',
  parseSSEEvent('data: {"choices":[{"delta":{"content":"","reasoning":"think"}}]}'),
  { type: 'reasoning', content: 'think' },
);
assertEqual('split and sticky packets', parseFragments(['data: he', 'llo\n\ndata: world\n\n']), [
  { type: 'text', content: 'hello' },
  { type: 'text', content: 'world' },
]);

if (failures.length) {
  console.error('[stream-protocol-check] failed');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('[stream-protocol-check] ok');

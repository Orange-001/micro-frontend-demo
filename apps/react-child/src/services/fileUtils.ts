const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const TEXT_EXTENSIONS = [
  '.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts',
  '.tsx', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.sh',
  '.yaml', '.yml', '.toml', '.ini', '.log', '.sql', '.r', '.rb', '.php',
  '.swift', '.kt', '.doc',
];

function readImageAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isSupportedType(file: File): boolean {
  if (IMAGE_MIME_TYPES.includes(file.type)) return true;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return TEXT_EXTENSIONS.includes(ext);
}

function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    md: 'text/markdown',
    txt: 'text/plain',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    json: 'application/json',
    csv: 'text/csv',
  };
  return map[ext ?? ''] || 'application/octet-stream';
}

export interface FileValidationResult {
  valid: File[];
  errors: string[];
}

export function validateFiles(files: File[]): FileValidationResult {
  const valid: File[] = [];
  const errors: string[] = [];
  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      errors.push(`"${f.name}" exceeds 20MB limit`);
    } else if (!isSupportedType(f)) {
      errors.push(`"${f.name}" has unsupported type`);
    } else {
      valid.push(f);
    }
  }
  return { valid, errors };
}

export async function processFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" exceeds 20MB limit`);
  }

  const isImage = IMAGE_MIME_TYPES.includes(file.type);
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error(`"${file.name}" exceeds 10MB limit`);
  }

  let preview = '';
  let content = '';

  if (isImage) {
    const dataUrl = await readImageAsDataURL(file);
    preview = dataUrl;
    content = dataUrl;
  } else {
    content = await file.text();
    preview = '';
  }

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type: file.type || guessMimeType(file.name),
    size: file.size,
    preview,
    content,
  };
}

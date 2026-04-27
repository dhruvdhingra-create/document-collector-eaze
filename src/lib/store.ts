import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Saves a file locally and returns the local file path.
 * This is abstracted so it can be swapped with S3 later.
 */
export async function saveFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const ext = path.extname(file.name);
  const uniqueName = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);
  
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  return fs.readFileSync(filePath);
}

export async function deleteFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

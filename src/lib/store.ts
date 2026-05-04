import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// ── MinIO config ────────────────────────────────────────────────────────────
const MINIO_ENDPOINT  = process.env.MINIO_ENDPOINT   // e.g. minio.myserver.com
const MINIO_PORT      = parseInt(process.env.MINIO_PORT || '9000')
const MINIO_USE_SSL   = process.env.MINIO_USE_SSL === 'true'
const MINIO_ACCESS    = process.env.MINIO_ACCESS_KEY
const MINIO_SECRET    = process.env.MINIO_SECRET_KEY
const MINIO_BUCKET    = process.env.MINIO_BUCKET || 'documents'

const USE_MINIO = !!(MINIO_ENDPOINT && MINIO_ACCESS && MINIO_SECRET)

// ── MinIO client (lazy) ─────────────────────────────────────────────────────
let _minioClient: any = null
function getMinioClient() {
  if (_minioClient) return _minioClient
  const { Client } = require('minio')
  _minioClient = new Client({
    endPoint:  MINIO_ENDPOINT,
    port:      MINIO_PORT,
    useSSL:    MINIO_USE_SSL,
    accessKey: MINIO_ACCESS,
    secretKey: MINIO_SECRET,
  })
  return _minioClient
}

async function ensureBucket() {
  const client = getMinioClient()
  const exists = await client.bucketExists(MINIO_BUCKET)
  if (!exists) await client.makeBucket(MINIO_BUCKET)
}

// ── Local fallback ──────────────────────────────────────────────────────────
const LOCAL_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
if (!USE_MINIO && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true })
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function saveFile(file: File): Promise<string> {
  const ext = path.extname(file.name)
  const objectName = `${randomUUID()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  if (USE_MINIO) {
    await ensureBucket()
    await getMinioClient().putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
    })
    return objectName  // stored as object name; bucket is fixed
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, objectName)
  fs.writeFileSync(filePath, buffer)
  return filePath
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
  if (USE_MINIO) {
    const client = getMinioClient()
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      client.getObject(MINIO_BUCKET, filePath, (err: any, stream: any) => {
        if (err) return reject(new Error('File not found'))
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    })
  }

  if (!fs.existsSync(filePath)) throw new Error('File not found')
  return fs.readFileSync(filePath)
}

export async function deleteFile(filePath: string) {
  if (USE_MINIO) {
    await getMinioClient().removeObject(MINIO_BUCKET, filePath).catch(() => {})
    return
  }
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

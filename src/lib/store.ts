import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// ── S3 / MinIO config ───────────────────────────────────────────────────────
const S3_ENDPOINT  = process.env.S3_ENDPOINT   // e.g. minio.myserver.com
const S3_PORT      = parseInt(process.env.S3_PORT || '9000')
const S3_USE_SSL   = process.env.S3_USE_SSL === 'true'
const S3_ACCESS    = process.env.S3_ACCESS_KEY
const S3_SECRET    = process.env.S3_SECRET_KEY
const S3_BUCKET    = process.env.S3_BUCKET || 'documents'

const USE_S3 = !!(S3_ENDPOINT && S3_ACCESS && S3_SECRET)

// ── S3 client (lazy) ────────────────────────────────────────────────────────
let _s3Client: any = null
function getS3Client() {
  if (_s3Client) return _s3Client
  const { Client } = require('minio')
  _s3Client = new Client({
    endPoint:  S3_ENDPOINT,
    port:      S3_PORT,
    useSSL:    S3_USE_SSL,
    accessKey: S3_ACCESS,
    secretKey: S3_SECRET,
  })
  return _s3Client
}

async function ensureBucket() {
  const client = getS3Client()
  const exists = await client.bucketExists(S3_BUCKET)
  if (!exists) await client.makeBucket(S3_BUCKET)
}

// ── Local fallback ──────────────────────────────────────────────────────────
const LOCAL_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
if (!USE_S3 && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true })
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function saveFile(file: File): Promise<string> {
  const ext = path.extname(file.name)
  const objectName = `${randomUUID()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  if (USE_S3) {
    await ensureBucket()
    await getS3Client().putObject(S3_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
    })
    return objectName
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, objectName)
  fs.writeFileSync(filePath, buffer)
  return filePath
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
  if (USE_S3) {
    const client = getS3Client()
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      client.getObject(S3_BUCKET, filePath, (err: any, stream: any) => {
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
  if (USE_S3) {
    await getS3Client().removeObject(S3_BUCKET, filePath).catch(() => {})
    return
  }
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

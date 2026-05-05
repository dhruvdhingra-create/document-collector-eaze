import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// ── S3 config ───────────────────────────────────────────────────────────────
const S3_REGION    = process.env.S3_REGION    || 'ap-south-1'
const S3_ENDPOINT  = process.env.S3_ENDPOINT  // e.g. s3.ap-south-1.amazonaws.com
const S3_ACCESS    = process.env.S3_ACCESS_KEY
const S3_SECRET    = process.env.S3_SECRET_KEY
const S3_BUCKET    = process.env.S3_BUCKET    || 'documents'
const S3_PREFIX    = process.env.S3_PREFIX    // e.g. "staging" — folder inside bucket

// S3_ENDPOINT is optional — omit for standard AWS S3, set for custom endpoints (MinIO etc.)
const USE_S3 = !!(S3_ACCESS && S3_SECRET)

// ── S3 client (lazy) ────────────────────────────────────────────────────────
let _s3Client: any = null
function getS3Client() {
  if (_s3Client) return _s3Client
  const { S3Client } = require('@aws-sdk/client-s3')
  _s3Client = new S3Client({
    region: S3_REGION,
    ...(S3_ENDPOINT ? { endpoint: `https://${S3_ENDPOINT}`, forcePathStyle: true } : {}),
    credentials: { accessKeyId: S3_ACCESS!, secretAccessKey: S3_SECRET! },
  })
  return _s3Client
}

function s3Key(objectName: string) {
  return S3_PREFIX ? `${S3_PREFIX}/${objectName}` : objectName
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
    const { PutObjectCommand } = require('@aws-sdk/client-s3')
    await getS3Client().send(new PutObjectCommand({
      Bucket:      S3_BUCKET,
      Key:         s3Key(objectName),
      Body:        buffer,
      ContentType: file.type,
    }))
    return objectName  // store only the object name; prefix is applied at runtime
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, objectName)
  fs.writeFileSync(filePath, buffer)
  return filePath
}

export async function getFileBuffer(filePath: string): Promise<Buffer> {
  if (USE_S3) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3')
    const res = await getS3Client().send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key:    s3Key(filePath),
    }))
    const chunks: Uint8Array[] = []
    for await (const chunk of res.Body as any) chunks.push(chunk)
    return Buffer.concat(chunks)
  }

  if (!fs.existsSync(filePath)) throw new Error('File not found')
  return fs.readFileSync(filePath)
}

export async function deleteFile(filePath: string) {
  if (USE_S3) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
    await getS3Client().send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key:    s3Key(filePath),
    })).catch(() => {})
    return
  }
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

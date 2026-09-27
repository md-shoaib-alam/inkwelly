import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { dataCache } from "./cache";

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

export const BUCKET_NAME = R2_BUCKET_NAME;

export async function uploadFile(
  file: File | Blob,
  folder: string = "logos"
): Promise<string> {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
    console.warn("R2 credentials not fully configured. File upload skipped.");
    return "";
  }

  let fileExtension = "png";
  if (file.type === "image/webp") fileExtension = "webp";
  else if (file.type === "image/jpeg" || file.type === "image/jpg") fileExtension = "jpg";
  else if (file.type === "image/svg+xml") fileExtension = "svg";

  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

  
  // Convert File/Blob to Buffer/ArrayBuffer for S3 upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type || "image/png",
  });

  try {
    await s3Client.send(command);
    return `${R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to storage");
  }
}

export async function checkR2Connection(): Promise<{ status: string; error?: string }> {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
    return { status: "not_configured" };
  }

  try {
    // Check if we have cached status first
    const cached = await dataCache.get<{ status: string; error?: string }>("r2_connection_status");
    if (cached) {
      return cached;
    }
  } catch (cacheError) {
    console.warn("Failed to check cache for R2 status:", cacheError);
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 1,
    });
    
    // Wrap R2 client send request in a 2500ms timeout race to prevent overall health/performance checks from hanging
    await Promise.race([
      s3Client.send(command),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("R2 storage check timed out after 2500ms")), 2500)
      )
    ]);
    
    const result = { status: "connected" };
    // Cache successful connection for 5 minutes
    await dataCache.set("r2_connection_status", result, 300000);
    return result;
  } catch (error) {
    const result = { status: "error", error: error instanceof Error ? error.message : String(error) };
    // Cache error for 15 seconds to allow quicker retry
    await dataCache.set("r2_connection_status", result, 15000);
    return result;
  }
}

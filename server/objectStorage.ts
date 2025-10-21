import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// Upload directory constant - hardcoded as requested
const UPLOAD_DIR = "uploads";

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// S3 Object wrapper to mimic Google Cloud Storage File interface
export class S3Object {
  constructor(
    public readonly bucketName: string,
    public readonly key: string,
    private metadata?: Record<string, string>
  ) {}

  async exists(): Promise<[boolean]> {
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: this.key,
      }));
      return [true];
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return [false];
      }
      throw error;
    }
  }

  async getMetadata(): Promise<[{ contentType?: string; size?: number; metadata?: Record<string, string> }]> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: this.key,
    });
    const response = await s3Client.send(command);
    return [{
      contentType: response.ContentType,
      size: response.ContentLength,
      metadata: response.Metadata,
    }];
  }

  async setMetadata(options: { metadata: Record<string, string> }): Promise<void> {
    // Get current object to preserve content type
    const [currentMetadata] = await this.getMetadata();
    
    // Copy object with new metadata (S3 requires copying to update metadata)
    await s3Client.send(new CopyObjectCommand({
      Bucket: this.bucketName,
      Key: this.key,
      CopySource: `${this.bucketName}/${this.key}`,
      Metadata: { ...currentMetadata.metadata, ...options.metadata },
      ContentType: currentMetadata.contentType,
      MetadataDirective: 'REPLACE',
    }));
    
    this.metadata = { ...currentMetadata.metadata, ...options.metadata };
  }

  createReadStream() {
    // Note: This returns a promise, not a stream directly
    // We'll handle this in downloadObject
    return s3Client.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: this.key,
    }));
  }

  get name(): string {
    return this.key;
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service for AWS S3
export class ObjectStorageService {
  private readonly bucketName: string;
  private readonly cdnBaseUrl: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || "";
    this.cdnBaseUrl = process.env.CDN_BASE_URL || "";
    
    if (!this.bucketName) {
      throw new Error(
        "AWS_S3_BUCKET not set. Please configure the S3 bucket name."
      );
    }
  }

  // Gets the S3 bucket name
  getBucketName(): string {
    return this.bucketName;
  }

  // Gets the CDN base URL
  getCdnBaseUrl(): string {
    return this.cdnBaseUrl;
  }

  // Search for a public object (simplified for S3 + CDN)
  async searchPublicObject(filePath: string): Promise<S3Object | null> {
    const key = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const s3Object = new S3Object(this.bucketName, key);
    
    const [exists] = await s3Object.exists();
    if (exists) {
      return s3Object;
    }
    
    return null;
  }

  // Downloads an object to the response
  async downloadObject(file: S3Object, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get object from S3
      const command = new GetObjectCommand({
        Bucket: file.bucketName,
        Key: file.key,
      });
      
      const response = await s3Client.send(command);
      
      // Get the ACL policy for the object
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      
      // Set appropriate headers
      res.set({
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": response.ContentLength?.toString() || "",
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      if (response.Body) {
        // @ts-ignore - AWS SDK v3 Body is a stream
        response.Body.pipe(res);
        
        // @ts-ignore
        response.Body.on("error", (err: any) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });
      } else {
        throw new Error("No body in S3 response");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity
  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const key = `${UPLOAD_DIR}/${objectId}`;

    // Generate presigned URL for PUT method with 15 minute expiry
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });
    
    return signedUrl;
  }

  // Gets the object entity file from the object path
  async getObjectEntityFile(objectPath: string): Promise<S3Object> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    const key = `${UPLOAD_DIR}/${entityId}`;
    
    const s3Object = new S3Object(this.bucketName, key);
    const [exists] = await s3Object.exists();
    
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return s3Object;
  }

  // Normalize object entity path from S3 URL to CDN URL or local path
  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a normalized path, return it
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    // Handle S3 URLs (both s3:// and https://bucket.s3.region.amazonaws.com/)
    if (rawPath.startsWith("https://") && rawPath.includes(".s3.") && rawPath.includes(".amazonaws.com")) {
      try {
        const url = new URL(rawPath);
        const pathParts = url.pathname.split("/").filter(p => p);
        
        // Check if path starts with upload directory
        if (pathParts[0] === UPLOAD_DIR && pathParts.length > 1) {
          const entityId = pathParts.slice(1).join("/");
          
          // Return CDN URL if available, otherwise return local path
          if (this.cdnBaseUrl) {
            return `${this.cdnBaseUrl}/${UPLOAD_DIR}/${entityId}`;
          }
          return `/objects/${entityId}`;
        }
      } catch (err) {
        console.error("Error parsing S3 URL:", err);
      }
    }
    
    // If it's already a CDN URL, return as-is
    if (this.cdnBaseUrl && rawPath.startsWith(this.cdnBaseUrl)) {
      return rawPath;
    }

    return rawPath;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    // Extract object ID from the raw path (S3 signed URL)
    let objectKey: string | null = null;
    
    try {
      if (rawPath.startsWith("https://") && rawPath.includes(this.bucketName)) {
        const url = new URL(rawPath);
        objectKey = url.pathname.split("?")[0]; // Remove query params
        if (objectKey.startsWith("/")) {
          objectKey = objectKey.slice(1);
        }
      }
    } catch (err) {
      console.error("Error parsing upload URL:", err);
    }
    
    if (!objectKey || !objectKey.startsWith(UPLOAD_DIR)) {
      throw new Error("Invalid upload URL");
    }
    
    // Create S3Object and set ACL policy
    const s3Object = new S3Object(this.bucketName, objectKey);
    await setObjectAclPolicy(s3Object, aclPolicy);
    
    // Return normalized path (CDN URL if available)
    const entityId = objectKey.replace(`${UPLOAD_DIR}/`, "");
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${UPLOAD_DIR}/${entityId}`;
    }
    
    return `/objects/${entityId}`;
  }

  // Checks if the user can access the object entity
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: S3Object;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      ...(userId && { userId }),
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

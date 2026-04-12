import { S3Client } from '@aws-sdk/client-s3';

// AWS credentials are optional for local development
const hasAwsCredentials = 
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY;

if (!hasAwsCredentials) {
  console.warn('⚠️  AWS credentials not configured. S3 upload features will be disabled.');
  console.warn('   Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY to enable.');
}

export const s3Client = hasAwsCredentials 
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

export const S3_CONFIG = {
  BUCKET_NAME: process.env.BUCKET_NAME,
  REGION: process.env.AWS_REGION,
  FOLDER_PREFIX: 'user-content',
  PRESIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
} as const;

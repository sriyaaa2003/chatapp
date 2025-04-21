// AWS Configuration
import AWS from 'aws-sdk';

// Initialize AWS
AWS.config.update({
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
    region: 'YOUR_REGION' // e.g., 'us-east-1'
});

// Create S3 instance
const s3 = new AWS.S3();

// Bucket name
const BUCKET_NAME = 'YOUR_BUCKET_NAME';

// Upload file to S3
export async function uploadToS3(file, path) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: path,
        Body: file,
        ContentType: file.type,
        ACL: 'public-read'
    };

    try {
        const data = await s3.upload(params).promise();
        return data.Location; // Returns the public URL of the uploaded file
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
}

export { s3, BUCKET_NAME };

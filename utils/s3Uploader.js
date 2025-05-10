import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export const uploadToS3 = async (file, folder = 'images') => {
  if (!file || !file.buffer || !file.originalname || !file.mimetype) {
    throw new Error('Invalid file object - missing required properties');
  }
  
  try {
    const fileExtension = file.originalname.split('.').pop();
    //const uniqueFilename = `images/${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;
    const uniqueFilename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;
    console.log('Uploading to S3 Bucket:', process.env.AWS_BUCKET_NAME); 
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uniqueFilename,
        Body: Readable.from(file.buffer),
        ContentType: file.mimetype,
   
      }
    });

    await upload.done();

    return {
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`,
      key: uniqueFilename
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};    
import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { Storage } from '@google-cloud/storage';
import { IncomingForm } from 'formidable';
const { promisify } = require('util');
const execAsync = promisify(exec);
const {VertexAI} = require('@google-cloud/vertexai');
import fs from 'fs';
import os from 'os';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

const storage = new Storage();
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || "";

const form = new IncomingForm();

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({project: process.env.GOOGLE_CLOUD_PROJECT_ID || "", location: process.env.GOOGLE_CLOUD_LOCATION || ""});
const model = 'gemini-1.5-pro-preview-0409';

// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 1,
    'topP': 0.95,
  },
  safetySettings: [
    {
        'category': 'HARM_CATEGORY_HATE_SPEECH',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_HARASSMENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],
});

async function activateServiceAccount(email: string, keyFile: string, projectId: string) {
  const cmd = `gcloud auth activate-service-account ${email} --key-file=${keyFile} --project=${projectId}`;
  try {
    const { stdout } = await execAsync(cmd);
    console.log("Service account activated successfully.");
    console.log(stdout); // Optionally log additional output from the command
  } catch (error) {
    console.error(`Failed to activate service account: ${error}`);
    throw error; // Throw the error to be handled by the caller
  }
}

async function generateContent(email: string, keyFile: string, projectId: string, video: string, activity: any ) {
  try {
    // Ensure service account is activated before proceeding
    await activateServiceAccount(email, keyFile, projectId);

    const currentDate = new Date().toISOString().slice(0, 10);

    const video1 = {
      fileData: {
      mimeType: 'video/mp4',
      fileUri: video
      }
    };

    const req = {
      contents: [
        {
          role: 'user', parts: [video1, {
            text: `
        Using the given activity as a reference, analyze the video content to determine how well it aligns with the intended activity. Provide a detailed assessment in JSON format with the following keys: 
        - "score": A numeric value ranging from 0 to 1, where 1 indicates perfect adherence to the activity.
        - "rationale": Explain your reasoning for the given score, detailing how closely the video's content matches the specified activity.
        - "video_description": Offer a comprehensive description of what is seen and heard in the video, noting any specific actions, reactions, and the general context.

        IMPORTANT: When given an activity that requires stating the current date, use this date (${currentDate}) to verify date related activities.
        TODAY'S DATE: ${currentDate}
        
        Example of expected output:
        
        {
          "score": "<Numeric value between 0 and 1>",
          "rationale": "<Detailed explanation for the score based on the activity and video content>",
          "video_description": "<Detailed description of the video content>"
        }
        
        INPUT
        ACTIVITY:${activity} 
        `}]
        }
      ],
    };

    const streamingResp = await generativeModel.generateContentStream(req);

    for await (const item of streamingResp.stream) {
      process.stdout.write('stream chunk: ' + JSON.stringify(item) + '\n');
    }

    process.stdout.write('aggregated response: ' + JSON.stringify(await streamingResp.response));

    const result = await streamingResp.response
    return result.candidates[0].content

  } catch (error) {
    console.error('Error during generation:', error);
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ error: 'Form parsing error' });
        }

        const uploadedFile = files['file'];
        const activity = Array.isArray(fields.description) ? fields.description[0] : fields.description;
   
        if (!uploadedFile) {
        return res.status(400).json({ error: 'No video file uploaded' });
        }

        // Ensure we're dealing with a single file scenario and the file type is correct
        const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
        if (!file) {
        return res.status(400).json({ error: 'File not found' });
        }

        const filePath = file.filepath;
        const outputFileName = 'output.mp4';
        const outputPath = path.join(os.tmpdir(), outputFileName);

        // Convert WebM to MP4 using FFmpeg
        exec(`ffmpeg -i "${filePath}" -c:v libx264 -preset fast -c:a aac "${outputPath}"`, async (error, stdout, stderr) => {
            if (error) {
                console.error('Conversion error:', error);
                return res.status(500).json({ error: 'Conversion failed' });
            }

            try {
                // Upload the converted file to Google Cloud Storage
                await storage.bucket(bucketName).upload(outputPath, {
                    destination: `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_VIDEO_FOLDER || ""}/${outputFileName}`,
                    preconditionOpts: { ifGenerationMatch: 0 },
                });
                console.log(`${outputPath} uploaded to ${bucketName}`);

                const video_gs_path = `gs://${process.env.GOOGLE_CLOUD_STORAGE_BUCKET || ""}/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_VIDEO_FOLDER || ""}/${outputFileName}`

                const response = await generateContent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "", process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || "", process.env.GOOGLE_CLOUD_PROJECT_ID || "", video_gs_path, activity);

                // Delete file

                await storage.bucket(bucketName).file(`pof_videos/${outputFileName}`).delete();
                console.log(`gs://${bucketName}/${`pof_videos/${outputFileName}`} deleted`);

                res.status(200).json({ message: response });
            } catch (uploadError) {
                console.error('Upload error:', uploadError);
                res.status(500).json({ error: 'Failed to upload file' });
            } finally {
                // Cleanup the temporary files
                fs.unlink(filePath, () => {}); // Delete the original file
                fs.unlink(outputPath, () => {}); // Delete the converted file
            }
        });
    });
};
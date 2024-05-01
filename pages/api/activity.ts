import type { NextApiRequest, NextApiResponse } from "next";
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const {VertexAI} = require('@google-cloud/vertexai');

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
  
  async function generateContent(email: string, keyFile: string, projectId: string, text: string) {
    try {
      // Ensure service account is activated before proceeding
      await activateServiceAccount(email, keyFile, projectId);

      const text1 = {text: `Instruction:
      Generate three short, simple activities that are safe, preserve the dignity of the patient, and are feasible considering the patient's current medical and physical limitations. These activities should be straightforward enough to serve as proof of life, suitable for a 20-second verification video recording. If the patient's condition allows, activities may also include audio elements.

      
      Input Details:
      Consider the following detailed patient information to ensure the activities are appropriate and doable within the 20-second time limit:
      
      ${text}
      
      Required Output Format:
      Provide your suggestions in the JSON format below. Each activity should be designed to be completed within 20 seconds, requiring minimal physical effort.
      
      {
        "activity_1": "<Describe the first activity in form of an instruction>",
        "activity_2": "<Describe the second activity in form of an instruction>",
        "activity_3": "<Describe the third activity in form of an instruction>"
      }
      
      IMPORTANT: Take patient condition into consideration before generating the activities. Ensure it it something the patient can do given their condition.
      
      RETURN ONLY THE JSON`};
  
      const req = {
        contents: [
          {role: 'user', parts: [text1]}
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
    // Ensure the method is POST
    if (req.method !== "POST") {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { age, condition, mobility, communicationAbility, additionalNotes } = req.body;

    const text = `
      Age (years): ${age}
      Medical Condition: ${condition}
      Mobility: ${mobility}
      Communication Ability: ${communicationAbility}
      Additional Notes: ${additionalNotes}
    `

    try {
        const response = await generateContent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "", process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || "", process.env.GOOGLE_CLOUD_PROJECT_ID || "", text);
        res.status(200).json({ result: response });
    } catch (error) {
        console.error('Error during content generation:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
};

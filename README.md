
# Genuify Application Setup Guide

This guide walks you through setting up Genuify application which is integrated with Google Cloud Services, including Cloud Storage and Vertex AI. Follow the steps below to configure your environment and run the application.

## Prerequisites

Before you begin, make sure you have the following:

- Node.js installed (recommend version 18.x or later)
- A Google Cloud Platform account
- Access to Google Cloud Storage and Vertex AI

## Setup Instructions

### 1. Google Service Account

To interact with Google Cloud services, you need to set up a service account:

1. **Create a service account** in the Google Cloud Console.
2. **Assign the necessary roles** to the service account. At minimum, grant roles for accessing Cloud Storage and Vertex AI.
3. **Download the service account key file (JSON)**. This file contains your credentials.

### 2. Local Environment Setup

After downloading your service account key file:

1. **Place the key file in the root directory** of your project.
2. **Update your `package.json`** to include the path to your key file in the `scripts` section. For example:
   ```json
   "scripts": {
     "dev": "export GOOGLE_APPLICATION_CREDENTIALS='your-keyfile.json' && next dev"
   }
   ```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following format:

```plaintext
GOOGLE_CLOUD_PROJECT_ID=""
GOOGLE_CLOUD_LOCATION=""
GOOGLE_CLOUD_STORAGE_BUCKET=""
GOOGLE_CLOUD_STORAGE_BUCKET_VIDEO_FOLDER=""
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_SERVICE_ACCOUNT_KEY_FILE="path/to/your-keyfile.json"
```

Ensure you fill out all the fields. Note that the `GOOGLE_CLOUD_STORAGE_BUCKET` should be in the same project as your Vertex AI service to ensure compatibility and proper access controls.

### 4. Install Dependencies

Run the following command to install the necessary dependencies:

```bash
npm install
```

### 5. Run the Development Server

Start the development server by running:

```bash
npm run dev
```

This will start the Next.js server, and you should be able to access the application at `http://localhost:3000`.


## Troubleshooting

If you encounter issues with Google Cloud services, check the following:

- Ensure that the project ID and service account roles are correctly configured.
- Ensure your Google Cloud project's settings and permissions are correctly configured to avoid service disruptions.
- Verify that the environment variables in the `.env` file are correctly set and match the names used in your application.
- Check the network settings if there is difficulty connecting to Google Cloud services.

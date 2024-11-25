const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

exports.processDocument = functions.httpsCallable(async (data) => {
    const { fileUrl, mimeType } = data;
    let extractedText = '';

    try {
        // 1. Fetch the file from Firebase Storage
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const fileBytes = response.data;

        // 2. Prepare the request for Document AI
        const documentAiRequest = {
            name: `projects/1013161197935/locations/us/processors/650c9164ed9c8ae9`,
            rawDocument: {
                content: fileBytes.toString('base64'),
                mimeType: mimeType,
            },
        };

        // 3. Call the Document AI API
        const docAiResponse = await axios.post(
            `https://us-documentai.googleapis.com/v1/${documentAiRequest.name}:process`,
            documentAiRequest,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.GOOGLE_CLOUD_API_KEY,
                },
            }
        );

        // 4. Extract text (this might need adjustment based on your Document AI response)
        extractedText = docAiResponse.data.text; //Check the actual response structure!


        return { data: { message: 'Success!', extractedText } };
    } catch (error) {
        console.error('Error:', error);
        //Return more specific error messages for better debugging
        if (error.response) {
            return { error: `Document AI API Error: ${error.response.status} - ${error.response.data}` };
        } else if (error.code === 'ECONNREFUSED') {
            return { error: 'Could not connect to Document AI API. Check your network.' };
        } else {
            return { error: 'Processing failed: ' + error.message };
        }
    }
});
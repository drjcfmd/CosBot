
import React, { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import firebaseConfig from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const functions = getFunctions();
const processDocumentFunction = httpsCallable(functions, 'processDocument');

function App() {
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [additionalField1, setAdditionalField1] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleAdditionalFieldChange = (e) => {
        setAdditionalField1(e.target.value);
    };

    const processDocument = async () => {
        setProcessing(true);
        setError(null);
        if (!file) {
            setError("Please select a file.");
            setProcessing(false);
            return;
        }

        try {
            const storageRef = ref(storage, `temp/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error("Upload error:", error);
                    setError("Upload failed: " + error.message);
                    setProcessing(false);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        const response = await processDocumentFunction({ fileUrl: downloadURL, mimeType: file.type });
                        if (response.data) {
                            setExtractedText(response.data.extractedText);
                            setError(null);
                            console.log("Processing successful!");
                        } else if (response.error) {
                            setError("Processing failed: " + response.error);
                        } else {
                            setError("Unexpected response from Cloud Function.");
                        }
                    } catch (error) {
                        console.error('Error processing document:', error);
                        setError("Processing failed: " + (error.message || error));
                    } finally {
                        setProcessing(false);
                    }
                }
            );
        } catch (error) {
            console.error('Error uploading document:', error);
            setError("Upload failed: " + (error.message || error));
            setProcessing(false);
        }
    };

    return (
        <div>
            <h1>Cosin - Medical Research Processor</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={processDocument} disabled={processing}>
                {processing ? 'Processing...' : 'Process Document'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {extractedText && (
                <div>
                    <h2>Extracted Text:</h2>
                    <textarea value={extractedText} readOnly />
                    <input
                        type="text"
                        value={additionalField1}
                        onChange={handleAdditionalFieldChange}
                        placeholder="Additional Field 1"
                    />
                </div>
            )}
        </div>
    );
}

export default App;
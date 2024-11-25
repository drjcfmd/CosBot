import { getStorage, ref, uploadString } from "firebase/storage";
// ... other imports

const saveData = async () => {
    const storage = getStorage(); //Get storage instance
    const storageRef = ref(storage, `processed/${Date.now()}.json`); //Use a unique filename
    try {
        await uploadString(storageRef, JSON.stringify(dataToSave), 'text');
        console.log("Data saved successfully!");
        // Optionally provide feedback to the user.
    } catch (error) {
        console.error("Error saving data:", error);
        // Handle the error appropriately (e.g., show an error message to the user).
    }
};
import { db } from "../firebase.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// const addUser = asyncHandler( async (req, res) => {
//     const { name, email } = req.body;
//     if (!name || !email) return res.status(400).json({ error: "Missing fields" });

//     try {
//         const newUser = await db.collection("users").add({ name, email });
//         res.json({ message: "User added!", id: newUser.id });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to add user" });
//     }
// });

// const getUsers = asyncHandler( async (req, res) => {
//     try {
//         const snapshot = await db.collection("users").get();
//         const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         res.json(users);
//     } catch (error) {
//         res.status(500).json({ error: "Failed to fetch users" });
//     }
// });

const videoToText = asyncHandler( async (req, res) => {
    const { video } = req.body;
    if (!video){
        throw new ApiError(500, "User not created! Try again...")
    }

    try {
        const newVideo = await db.collection("videos").add({ video });
        res.json(new ApiResponse(200, newVideo.id, "Video added!"));
    } 
    catch (error) {
        throw new ApiError(500, "Failed to add video! Try again...");
    }
});

export { addUser, getUsers, videoToText };
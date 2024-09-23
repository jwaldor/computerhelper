import express from "express";
import OpenAI from "openai";
import cors from "cors"; // Import CORS
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON requests
app.use(express.json());
// Enable CORS for specific origin
app.use(cors({
    origin: "http://localhost:1212", // Replace with your frontend URL
}));
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});
app.post("/chat", async (req, res) => {
    const conversation = req.body.conversation;
    console.log("conversation", conversation);
    const response = await client.chat.completions.create({
        messages: conversation,
        model: "gpt-4o-2024-08-06",
    });
    res.json(response.choices[0].message.content);
});
// Sample route
app.get("/", (req, res) => {
    res.send("Hello, World!");
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

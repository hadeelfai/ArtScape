import { spawn } from "child_process";
import Artwork from "../models/Artwork.js";

//for faster UI compute in the background

export async function computeEmbeddingInBackground(artworkId, imageUrl) {
    console.log("Starting background embedding job...");

    const python = spawn("python", ["python/compute_embeddings.py", imageUrl]);
    python.stdout.on("data", async (data) => {
        try {
            const vector = JSON.parse(data.toString());
            await Artwork.findByIdAndUpdate(artworkId, { embedding: vector });
            console.log("✔ Embedding saved for", artworkId);
        } catch (err) {
            console.error("Failed to save embedding:", err.message);
        }
    });
    python.stderr.on("data", (data) => {
        console.error("Python error:", data.toString());
    });
}

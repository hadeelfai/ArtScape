import { spawn } from "child_process";
import Artwork from "../models/Artwork.js";

//for faster UI compute in the background
export async function computeEmbeddingInBackground(artworkId, imageUrl) {
    console.log("**Starting background embedding job...");

    const python = spawn("python", ["python/compute_embeddings.py", imageUrl]);
    let buffer = "";
    python.stdout.on("data", (data) => {
        buffer += data.toString();  //collect all parts
    });
    python.stdout.on("end", async () => {
        try {
            const vector = JSON.parse(buffer);   //parse after all data collected
            await Artwork.findByIdAndUpdate(artworkId, { embedding: vector });
            console.log("✔ Embedding saved for", artworkId);
        } catch (err) {
            console.error("Failed to save embedding:", err.message);
            console.error("Raw output:", buffer);
        }
    });
    python.stderr.on("data", (data) => {
        console.error("Python error:", data.toString());
    });
}

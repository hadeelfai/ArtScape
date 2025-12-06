import { exec } from "child_process";
//call Python script and return the embedding as an array

export function getPythonEmbedding(imageUrl) {
  return new Promise((resolve, reject) => {
    exec(`python python/compute_embeddings.py "${imageUrl}"`, (error, stdout, stderr) => {
      if (error) return reject(error);
      try {
        const embedding = JSON.parse(stdout);
        resolve(embedding);
      } catch (err) {
        reject(err);
      }
    });
  });
}

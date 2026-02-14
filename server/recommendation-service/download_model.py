
from transformers import CLIPModel, CLIPProcessor
import os

# Set cache directory to local models folder
cache_dir = "./models"
model_name = "openai/clip-vit-base-patch32"

print(f"Downloading {model_name} to {cache_dir}...")

# Download model and processor
model = CLIPModel.from_pretrained(model_name, cache_dir=cache_dir)
processor = CLIPProcessor.from_pretrained(model_name, cache_dir=cache_dir)

print("Download complete!")
print(f"Model saved in: {os.path.abspath(cache_dir)}")
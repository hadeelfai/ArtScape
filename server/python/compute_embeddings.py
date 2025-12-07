import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import requests
from io import BytesIO
# import json
# import sys

# Load model and processor //OpenAI’s CLIP model
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32",use_fast=True)

def get_embedding(image_url):
    response = requests.get(image_url)
    image = Image.open(BytesIO(response.content)).convert("RGB")
    
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        embedding = model.get_image_features(**inputs)
    
    # Convert to list to store in DB
    return embedding[0].tolist()

# If run from command line with URL to test only

# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print("Usage: python compute_embeddings.py <image_url>")
#         sys.exit(1)
    
#     url = sys.argv[1]
#     embedding = get_embedding(url)
#     print(json.dumps(embedding))

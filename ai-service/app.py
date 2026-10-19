import io
import json
import logging
from pathlib import Path

import torch
import torch.nn.functional as F
import torch.nn as nn

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms, models


logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pestshield-ai")


# ============================================================
# PATHS / CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"

CROPS = ["groundnut", "potato", "chilli"]

CONFIDENCE_THRESHOLD = 0.60

IMG_SIZE = 224

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])


device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="PestShield AI Detection Service"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODEL FILES
# ============================================================

MODEL_PATHS = {
    "groundnut": MODELS_DIR / "groundnut_mobilenet_v2.pt",
    "potato": MODELS_DIR / "potato_mobilenet_v2.pt",
    "chilli": MODELS_DIR / "chilli_mobilenet_v2.pt",
}


# ============================================================
# LOAD CLASS NAMES
# ============================================================

def load_class_names(crop):
    """
    Load class names from the shared class_names.json.

    Expected structure:

    {
        "groundnut": [...],
        "potato": [...],
        "chilli": [...]
    }
    """

    json_path = MODELS_DIR / "class_names.json"

    if not json_path.exists():
        raise RuntimeError(
            f"class_names.json not found at {json_path}"
        )

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if crop not in data:
        raise RuntimeError(
            f"No class names found for crop '{crop}' "
            f"in class_names.json"
        )

    class_names = data[crop]

    if not isinstance(class_names, list):
        raise RuntimeError(
            f"Class names for '{crop}' must be a list."
        )

    return class_names


# ============================================================
# BUILD MOBILE NET V2
# ============================================================

def build_mobilenet_v2(num_classes):

    model = models.mobilenet_v2(
        weights=None
    )

    model.classifier[1] = nn.Linear(
        model.last_channel,
        num_classes
    )

    return model


# ============================================================
# LOAD MODEL
# ============================================================

_loaded = {}


def load_model(crop):

    if crop in _loaded:
        return _loaded[crop]

    if crop not in MODEL_PATHS:
        raise HTTPException(
            status_code=400,
            detail=f"No model configuration for crop '{crop}'."
        )

    model_path = MODEL_PATHS[crop]

    if not model_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Model file not found: {model_path}"
        )

    # Load class names
    class_names = load_class_names(crop)

    num_classes = len(class_names)

    log.info(
        f"Loading {crop} MobileNetV2 with "
        f"{num_classes} classes..."
    )

    try:

        checkpoint = torch.load(
            str(model_path),
            map_location=device,
            weights_only=False
        )

        # Your models are raw state_dict / OrderedDict files
        state_dict = checkpoint

        model = build_mobilenet_v2(
            num_classes
        )

        model.load_state_dict(
            state_dict
        )

        model.to(device)
        model.eval()

        _loaded[crop] = (
            model,
            class_names
        )

        log.info(
            f"Successfully loaded {crop} model: "
            f"{model_path.name}"
        )

        return _loaded[crop]

    except Exception as e:

        log.exception(
            f"Failed to load {crop} model"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Could not load {model_path.name}. "
                f"Model loading error: {str(e)}"
            )
        )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "device": str(device)
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
async def predict(
    crop: str = Form(...),
    image: UploadFile = File(...)
):

    crop = crop.strip().lower()

    # Validate crop
    if crop not in CROPS:

        raise HTTPException(
            status_code=400,
            detail=f"crop must be one of {CROPS}"
        )

    # Load correct crop model
    model, class_names = load_model(crop)

    # Read uploaded image
    try:

        img_bytes = await image.read()

        img = Image.open(
            io.BytesIO(img_bytes)
        ).convert("RGB")

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a readable image."
        )

    # Preprocess
    tensor = transform(img).unsqueeze(0).to(device)

    # Prediction
    with torch.no_grad():

        outputs = model(tensor)

        probs = F.softmax(
            outputs,
            dim=1
        )[0]

        confidence, index = torch.max(
            probs,
            dim=0
        )

    index = index.item()

    confidence = round(
        confidence.item(),
        4
    )

    # Map index → class name
    if index < len(class_names):

        predicted_class = class_names[index]

    else:

        predicted_class = f"class_{index}"

    return {

        "crop": crop,

        "predicted_class": predicted_class,

        "confidence": confidence,

        "confident": (
            confidence >= CONFIDENCE_THRESHOLD
        ),

        "model": MODEL_PATHS[crop].name,

        "device": str(device)
    }
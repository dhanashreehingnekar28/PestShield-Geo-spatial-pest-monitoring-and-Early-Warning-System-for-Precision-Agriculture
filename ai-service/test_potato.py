import torch
import torch.nn as nn
from torchvision import models

MODEL_PATH = "models/potato_mobilenet_v2.pt"

NUM_CLASSES = 7

print("Loading checkpoint...")

state_dict = torch.load(
    MODEL_PATH,
    map_location="cpu",
    weights_only=False
)

print("Checkpoint type:", type(state_dict))

print("Building MobileNetV2...")

model = models.mobilenet_v2(weights=None)

model.classifier[1] = nn.Linear(
    model.last_channel,
    NUM_CLASSES
)

print("Loading state_dict...")

model.load_state_dict(state_dict)

model.eval()

print()
print("SUCCESS!")
print("Potato MobileNetV2 loaded successfully.")
print("Number of classes:", NUM_CLASSES)
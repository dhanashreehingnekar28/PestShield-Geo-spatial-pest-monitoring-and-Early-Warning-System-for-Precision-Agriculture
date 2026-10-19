"""Architecture builders — must match the training notebook exactly so a
raw state_dict (if that's what was saved) loads without key mismatches."""
import torch.nn as nn
from torchvision import models


def build_resnet18(num_classes):
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def build_mobilenet_v2(num_classes):
    model = models.mobilenet_v2(weights=None)
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
    return model


ARCH_BUILDERS = {
    "resnet18": build_resnet18,
    "mobilenet_v2": build_mobilenet_v2,
}

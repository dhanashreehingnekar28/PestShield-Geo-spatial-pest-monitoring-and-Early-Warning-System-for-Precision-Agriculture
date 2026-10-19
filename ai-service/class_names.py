# Fallback class name lists — ONLY used if no class_indices.json file is
# found sitting next to a model file. These must match the alphabetical
# folder order torchvision.datasets.ImageFolder used during training,
# since that's how numeric class indices get assigned.
#
# Groundnut and Potato below are confirmed correct — they match the class
# names established in the training notebook, sorted alphabetically.
#
# !!! CHILLI IS A PLACEHOLDER !!!
# I don't know your chilli dataset's actual class folder names. Fix this
# by either:
#   (a) making sure chilli_classes.json (or class_indices.json) sits next
#       to the chilli model file in ai-service/models/ — the service will
#       use that automatically and ignore this list entirely, or
#   (b) editing the "chilli" list below: open your chilli dataset folder,
#       list the class subfolder names, sort them ALPHABETICALLY, and put
#       them in that exact order here.

FALLBACK_CLASSES = {
    "groundnut": ["Alternaria_Leaf_Spot", "Healthy", "Leaf_Spot", "Rosette", "Rust"],
    "potato": ["Early_Blight", "Healthy", "Late_Blight"],
    "chilli": ["CLASS_0_EDIT_ME", "CLASS_1_EDIT_ME", "CLASS_2_EDIT_ME"],  # TODO — see note above
}

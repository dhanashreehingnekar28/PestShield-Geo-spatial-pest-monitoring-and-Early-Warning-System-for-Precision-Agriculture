import torch

model_path = "models/potato_mobilenet_v2.pt"

checkpoint = torch.load(
    model_path,
    map_location="cpu",
    weights_only=False
)

print("TYPE:")
print(type(checkpoint))

if isinstance(checkpoint, dict):
    print("\nCHECKPOINT KEYS:")
    for key in checkpoint.keys():
        print("-", key)

    print("\nCLASS INFORMATION:")
    for key in [
        "class_names",
        "classes",
        "class_to_idx",
        "idx_to_class",
        "names"
    ]:
        if key in checkpoint:
            print(key, "=", checkpoint[key])
else:
    print("\nMODEL:")
    print(checkpoint)
# PestShield AI Detection Service

Loads your 3 trained models (groundnut, potato, chilli) and serves predictions
over HTTP. The Node backend calls this — the React frontend never talks to it
directly.

## Step 1 — Drop your 3 model files in

Put your 3 `.pt` files in `ai-service/models/`, named:
```
models/groundnut.pt
models/potato.pt
models/chilli.pt
```

If your teammate's files are named differently (e.g. `best_groundnut_resnet18.pt`),
either rename them to the above, or just leave them — the service also
recognizes `best_<crop>.pt`, `best_<crop>_resnet18.pt`, and `best_<crop>_mobilenet_v2.pt`
automatically.

**If you have `class_indices.json` files from training** (one per crop), drop
those in the same folder too, named `<crop>_classes.json` (e.g.
`groundnut_classes.json`) or just `class_indices.json` if there's only one set
in this folder. The service uses these automatically when present — this is
the safest option since it guarantees correct labels.

**If you don't have those files:** the service falls back to hardcoded class
lists in `class_names.py`. Groundnut and potato are already filled in
correctly. **Chilli is a placeholder** — open `class_names.py` and read the
comment at the top for how to fix it in under a minute.

## Step 2 — Install and run

bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

view something like this:
Loaded groundnut model from groundnut.pt as torchscript (5 classes)

— that "as torchscript" or "as resnet18" / "as mobilenet_v2" tells you which
loading path actually worked, useful to know if something looks off later.

## Step 3 — Test it directly before wiring anything else

bash
curl -X POST http://localhost:8000/predict \
  -F "crop=groundnut" \
  -F "image=@/path/to/any/groundnut/leaf/photo.jpg"

Expected response:
json
{
  "crop": "groundnut",
  "predicted_class": "Rust",
  "confidence": 0.91,
  "confident": true,
  "model_format_detected": "torchscript"
}

Do this for all 3 crops before touching the Node/React side — if a model is
going to fail to load, you want to find out here, not mid-demo.

## Troubleshooting

**"No model file found for 'X'"** — check the exact filename in `ai-service/models/`
against the naming patterns in Step 1.

**"Could not load '<file>' as TorchScript or as a resnet18/mobilenet_v2 state_dict"**
— the file is in a format this service doesn't recognize. Run this yourself to see what it actually is:
```python
import torch
obj = torch.load("models/groundnut.pt", map_location="cpu")
print(type(obj))
```
If it's a plain `dict` but the keys don't look like layer names (e.g. it has
a key like `"model_state_dict"` or `"model"` wrapping the real state dict),
tell me what `print(obj.keys())` shows and I'll adjust `try_load_model` in
`app.py` to unwrap it correctly.

**Predictions look consistently wrong/shuffled** (e.g. always confusing two
specific classes) — almost always a class-order mismatch, not a broken model.
Double check the class list order (alphabetical, matching training) — this is
exactly what the `class_indices.json` files protect you from, so if you have
them, use them.

**Low confidence on every prediction** — check `IMG_SIZE`/normalization in
`app.py` actually matches what was used during training. This service assumes
224×224 + ImageNet mean/std normalization (the standard setup, and what the
original training notebook used) — if your teammate's `train_and_eval` did
something different, predictions will still return but will be less accurate.

from dataset import load_dataset
from model import build_model
import pickle

df = load_dataset()

X = df[["avg_duration", "avg_productivity", "sessions", "grade_ratio"]]
y = []

for ratio in df["grade_ratio"]:
    if ratio < 0.5:
        y.append("High")
    elif ratio < 0.75:
        y.append("Medium")
    else:
        y.append("Low")

model = build_model()
model.fit(X, y)

with open("subject_priority_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained")
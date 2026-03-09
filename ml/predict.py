import pickle
from dataset import load_dataset

with open("subject_priority_model.pkl", "rb") as f:
    model = pickle.load(f)

df = load_dataset()
X = df[["avg_duration", "avg_productivity", "sessions", "grade_ratio"]]

df["priority"] = model.predict(X)
print(df[["subject", "priority"]])
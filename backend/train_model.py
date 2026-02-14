"""Train ML model for sales prediction"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os

DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(DIR, "kaspi.csv")

print("Loading data...")
df = pd.read_csv(CSV_PATH, encoding="utf-8")
df["sale_price"] = pd.to_numeric(df["sale_price"], errors="coerce").fillna(0)
df["sale_qty"] = pd.to_numeric(df["sale_qty"], errors="coerce").fillna(0)
df["merchant_count"] = pd.to_numeric(df["merchant_count"], errors="coerce").fillna(0)

# Filter out zero-sales
df = df[df["sale_qty"] > 0]
print(f"Training on {len(df)} products with sales > 0")

# Encode categories and brands
cat_enc = LabelEncoder()
brand_enc = LabelEncoder()
df["cat_encoded"] = cat_enc.fit_transform(df["category_name"].fillna("Unknown"))
df["brand_encoded"] = brand_enc.fit_transform(df["brand_name"].fillna("Unknown"))

X = df[["cat_encoded", "brand_encoded", "sale_price", "merchant_count"]].values
y = np.log1p(df["sale_qty"].values)  # log transform for better prediction

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training model...")
model = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
)
model.fit(X_train, y_train)

train_score = model.score(X_train, y_train)
test_score = model.score(X_test, y_test)
print(f"Train R²: {train_score:.4f}")
print(f"Test R²:  {test_score:.4f}")

# Save
joblib.dump(model, os.path.join(DIR, "model.joblib"))
joblib.dump({"category": cat_enc, "brand": brand_enc}, os.path.join(DIR, "encoders.joblib"))
print("Model saved!")

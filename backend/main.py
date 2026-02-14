from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import json
import os
import io
import joblib
from typing import Optional

# --- Load data on startup ---
CSV_PATH = os.path.join(os.path.dirname(__file__), "kaspi.csv")
df: pd.DataFrame = pd.DataFrame()
model = None

def _load_data():
    global df, model
    print("Loading CSV...")
    df_raw = pd.read_csv(CSV_PATH, encoding="utf-8")

    # Clean & type-cast
    df_raw["sale_price"] = pd.to_numeric(df_raw["sale_price"], errors="coerce").fillna(0).astype(int)
    df_raw["sale_qty"] = pd.to_numeric(df_raw["sale_qty"], errors="coerce").fillna(0).astype(int)
    df_raw["sale_amount"] = pd.to_numeric(df_raw["sale_amount"], errors="coerce").fillna(0).astype(np.int64)
    df_raw["product_rate"] = pd.to_numeric(df_raw["product_rate"], errors="coerce").fillna(0).astype(float)
    df_raw["review_qty"] = pd.to_numeric(df_raw["review_qty"], errors="coerce").fillna(0).astype(int)
    df_raw["merchant_count"] = pd.to_numeric(df_raw["merchant_count"], errors="coerce").fillna(0).astype(int)
    df_raw["amount_abc"] = pd.to_numeric(df_raw["amount_abc"], errors="coerce").fillna(3).astype(int)
    df_raw["show_order_num"] = pd.to_numeric(df_raw["show_order_num"], errors="coerce").fillna(0).astype(int)

    # Parse dates
    df_raw["created_dt"] = pd.to_datetime(df_raw["created_dt"], errors="coerce")
    df_raw["last_sale_date"] = pd.to_datetime(df_raw["last_sale_date"], errors="coerce")

    # Extract first image URL from preview_image_list JSON
    def extract_image(img_str):
        if pd.isna(img_str) or not img_str:
            return ""
        try:
            images = json.loads(img_str.replace("'", '"'))
            if images and isinstance(images, list):
                return images[0].get("medium", images[0].get("small", ""))
        except:
            pass
        return ""

    df_raw["image_url"] = df_raw["preview_image_list"].apply(extract_image)

    df = df_raw
    print(f"Loaded {len(df)} products")

    # Load ML model if exists
    model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print("ML model loaded")


@asynccontextmanager
async def lifespan(app):
    _load_data()
    yield

app = FastAPI(title="Kaspi Analytics API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- DASHBOARD ---
@app.get("/api/dashboard")
def get_dashboard():
    total_products = len(df)
    total_revenue = int(df["sale_amount"].sum())
    total_sold = int(df["sale_qty"].sum())
    avg_price = int(df["sale_price"].mean())
    avg_rating = round(float(df["product_rate"].mean()), 2)
    total_reviews = int(df["review_qty"].sum())
    unique_brands = int(df["brand_name"].nunique())
    unique_categories = int(df["category_name"].nunique())

    # ABC distribution
    abc = df["amount_abc"].value_counts().to_dict()
    abc_data = [
        {"name": "A (лидеры)", "value": abc.get(1, 0), "abc": 1},
        {"name": "B (средние)", "value": abc.get(2, 0), "abc": 2},
        {"name": "C (аутсайдеры)", "value": abc.get(3, 0), "abc": 3},
    ]

    # Top 10 categories by revenue
    top_cats_rev = (
        df.groupby("category_name")
        .agg(revenue=("sale_amount", "sum"), products=("product_code", "count"))
        .sort_values("revenue", ascending=False)
        .head(10)
        .reset_index()
    )
    top_categories = [
        {"name": row["category_name"], "revenue": int(row["revenue"]), "products": int(row["products"])}
        for _, row in top_cats_rev.iterrows()
    ]

    # Top 10 brands by revenue
    top_br_rev = (
        df.groupby("brand_name")
        .agg(revenue=("sale_amount", "sum"), products=("product_code", "count"), avg_rating=("product_rate", "mean"))
        .sort_values("revenue", ascending=False)
        .head(10)
        .reset_index()
    )
    top_brands = [
        {"name": row["brand_name"], "revenue": int(row["revenue"]), "products": int(row["products"]), "avg_rating": round(row["avg_rating"], 2)}
        for _, row in top_br_rev.iterrows()
    ]

    # Top 10 categories by qty sold
    top_cats_qty = (
        df.groupby("category_name")
        .agg(sold=("sale_qty", "sum"))
        .sort_values("sold", ascending=False)
        .head(10)
        .reset_index()
    )
    top_categories_qty = [
        {"name": row["category_name"], "sold": int(row["sold"])}
        for _, row in top_cats_qty.iterrows()
    ]

    # Price distribution (buckets)
    bins = [0, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 5000001]
    labels = ["0-5K", "5-10K", "10-25K", "25-50K", "50-100K", "100-250K", "250-500K", "500K-1M", "1M+"]
    price_dist = pd.cut(df["sale_price"], bins=bins, labels=labels, right=False).value_counts().sort_index()
    price_distribution = [{"range": k, "count": int(v)} for k, v in price_dist.items()]

    # Rating distribution
    rating_bins = [0, 1, 2, 3, 4, 4.5, 5.01]
    rating_labels = ["0-1", "1-2", "2-3", "3-4", "4-4.5", "4.5-5"]
    rating_dist = pd.cut(df["product_rate"], bins=rating_bins, labels=rating_labels, right=False).value_counts().sort_index()
    rating_distribution = [{"range": k, "count": int(v)} for k, v in rating_dist.items()]

    # Parent category breakdown
    parent_cats = (
        df.groupby("_category_name")
        .agg(revenue=("sale_amount", "sum"), products=("product_code", "count"), sold=("sale_qty", "sum"))
        .sort_values("revenue", ascending=False)
        .reset_index()
    )
    parent_categories = [
        {"name": row["_category_name"], "revenue": int(row["revenue"]), "products": int(row["products"]), "sold": int(row["sold"])}
        for _, row in parent_cats.iterrows()
    ]

    return {
        "kpi": {
            "total_products": total_products,
            "total_revenue": total_revenue,
            "total_sold": total_sold,
            "avg_price": avg_price,
            "avg_rating": avg_rating,
            "total_reviews": total_reviews,
            "unique_brands": unique_brands,
            "unique_categories": unique_categories,
        },
        "abc_data": abc_data,
        "top_categories": top_categories,
        "top_brands": top_brands,
        "top_categories_qty": top_categories_qty,
        "price_distribution": price_distribution,
        "rating_distribution": rating_distribution,
        "parent_categories": parent_categories,
    }


# --- PRODUCTS (paginated, searchable, filterable) ---
@app.get("/api/products")
def get_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    abc: Optional[int] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort_by: str = Query("sale_amount", pattern="^(sale_amount|sale_price|product_rate|review_qty|sale_qty|show_order_num)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
):
    filtered = df.copy()

    if search:
        search_lower = search.lower()
        filtered = filtered[
            filtered["product_name"].str.lower().str.contains(search_lower, na=False)
            | filtered["brand_name"].str.lower().str.contains(search_lower, na=False)
        ]

    if category:
        filtered = filtered[filtered["category_name"] == category]

    if brand:
        filtered = filtered[filtered["brand_name"] == brand]

    if abc is not None:
        filtered = filtered[filtered["amount_abc"] == abc]

    if min_price is not None:
        filtered = filtered[filtered["sale_price"] >= min_price]

    if max_price is not None:
        filtered = filtered[filtered["sale_price"] <= max_price]

    total = len(filtered)
    ascending = sort_order == "asc"
    filtered = filtered.sort_values(sort_by, ascending=ascending)

    start = (page - 1) * per_page
    end = start + per_page
    page_data = filtered.iloc[start:end]

    products = []
    for _, row in page_data.iterrows():
        products.append({
            "product_code": str(row["product_code"]),
            "product_name": row["product_name"],
            "brand_name": row["brand_name"],
            "category_name": row["category_name"],
            "parent_category": row["_category_name"],
            "sale_price": int(row["sale_price"]),
            "product_rate": float(row["product_rate"]),
            "review_qty": int(row["review_qty"]),
            "sale_qty": int(row["sale_qty"]),
            "sale_amount": int(row["sale_amount"]),
            "merchant_count": int(row["merchant_count"]),
            "amount_abc": int(row["amount_abc"]),
            "image_url": row["image_url"],
            "product_url": row.get("product_url", ""),
        })

    return {
        "products": products,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


# --- FILTERS (for dropdowns) ---
@app.get("/api/filters")
def get_filters():
    categories = sorted(df["category_name"].dropna().unique().tolist())
    brands = (
        df.groupby("brand_name")
        .size()
        .sort_values(ascending=False)
        .head(200)
        .index.tolist()
    )
    parent_categories = sorted(df["_category_name"].dropna().unique().tolist())
    return {
        "categories": categories,
        "brands": brands,
        "parent_categories": parent_categories,
    }


# --- CATEGORY ANALYTICS ---
@app.get("/api/categories/{category_name}")
def get_category_analytics(category_name: str):
    cat_df = df[df["category_name"] == category_name]
    if cat_df.empty:
        return {"error": "Category not found"}

    # Metrics
    total_products = len(cat_df)
    total_revenue = int(cat_df["sale_amount"].sum())
    total_sold = int(cat_df["sale_qty"].sum())
    avg_price = int(cat_df["sale_price"].mean())
    avg_rating = round(float(cat_df["product_rate"].mean()), 2)
    avg_merchants = round(float(cat_df["merchant_count"].mean()), 1)

    # Top brands in category
    top_brands = (
        cat_df.groupby("brand_name")
        .agg(revenue=("sale_amount", "sum"), products=("product_code", "count"), avg_price=("sale_price", "mean"))
        .sort_values("revenue", ascending=False)
        .head(10)
        .reset_index()
    )
    brands_data = [
        {"name": r["brand_name"], "revenue": int(r["revenue"]), "products": int(r["products"]), "avg_price": int(r["avg_price"])}
        for _, r in top_brands.iterrows()
    ]

    # Price histogram
    prices = cat_df["sale_price"].tolist()
    price_min, price_max = int(cat_df["sale_price"].min()), int(cat_df["sale_price"].max())

    # Rating vs Sales scatter (sample max 500)
    sample = cat_df.sample(min(500, len(cat_df)))
    scatter = [
        {"rating": float(r["product_rate"]), "sales": int(r["sale_qty"]), "price": int(r["sale_price"]), "name": r["product_name"][:40]}
        for _, r in sample.iterrows()
    ]

    # ABC breakdown
    abc = cat_df["amount_abc"].value_counts().to_dict()

    return {
        "name": category_name,
        "metrics": {
            "total_products": total_products,
            "total_revenue": total_revenue,
            "total_sold": total_sold,
            "avg_price": avg_price,
            "avg_rating": avg_rating,
            "avg_merchants": avg_merchants,
        },
        "top_brands": brands_data,
        "price_range": {"min": price_min, "max": price_max},
        "scatter": scatter,
        "abc": {"A": abc.get(1, 0), "B": abc.get(2, 0), "C": abc.get(3, 0)},
    }


# --- BRAND COMPARISON ---
@app.get("/api/brands/compare")
def compare_brands(brands: str = Query(..., description="Comma-separated brand names")):
    brand_list = [b.strip() for b in brands.split(",")]
    result = []
    for brand_name in brand_list[:5]:
        br_df = df[df["brand_name"] == brand_name]
        if br_df.empty:
            continue
        result.append({
            "name": brand_name,
            "products": len(br_df),
            "revenue": int(br_df["sale_amount"].sum()),
            "avg_price": int(br_df["sale_price"].mean()),
            "avg_rating": round(float(br_df["product_rate"].mean()), 2),
            "total_sold": int(br_df["sale_qty"].sum()),
            "total_reviews": int(br_df["review_qty"].sum()),
        })
    return result


# --- BRAND ANALYTICS ---
@app.get("/api/brands/{brand_name}")
def get_brand_analytics(brand_name: str):
    br_df = df[df["brand_name"] == brand_name]
    if br_df.empty:
        return {"error": "Brand not found"}

    total_products = len(br_df)
    total_revenue = int(br_df["sale_amount"].sum())
    total_sold = int(br_df["sale_qty"].sum())
    avg_price = int(br_df["sale_price"].mean())
    avg_rating = round(float(br_df["product_rate"].mean()), 2)
    total_reviews = int(br_df["review_qty"].sum())

    # Categories breakdown
    cats = (
        br_df.groupby("category_name")
        .agg(revenue=("sale_amount", "sum"), products=("product_code", "count"))
        .sort_values("revenue", ascending=False)
        .head(10)
        .reset_index()
    )
    categories_data = [
        {"name": r["category_name"], "revenue": int(r["revenue"]), "products": int(r["products"])}
        for _, r in cats.iterrows()
    ]

    # Top products
    top_prods = br_df.sort_values("sale_amount", ascending=False).head(10)
    top_products = [
        {
            "product_name": r["product_name"],
            "sale_price": int(r["sale_price"]),
            "sale_qty": int(r["sale_qty"]),
            "sale_amount": int(r["sale_amount"]),
            "product_rate": float(r["product_rate"]),
            "image_url": r["image_url"],
        }
        for _, r in top_prods.iterrows()
    ]

    return {
        "name": brand_name,
        "metrics": {
            "total_products": total_products,
            "total_revenue": total_revenue,
            "total_sold": total_sold,
            "avg_price": avg_price,
            "avg_rating": avg_rating,
            "total_reviews": total_reviews,
        },
        "categories": categories_data,
        "top_products": top_products,
    }


# --- ML PREDICTION ---
@app.post("/api/predict")
def predict_sales(data: dict):
    global model
    model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    encoders_path = os.path.join(os.path.dirname(__file__), "encoders.joblib")

    if not os.path.exists(model_path):
        return {"error": "Model not trained yet"}

    model = joblib.load(model_path)
    encoders = joblib.load(encoders_path)

    category = data.get("category", "Смартфоны")
    brand = data.get("brand", "Apple")
    price = data.get("price", 100000)
    merchants = data.get("merchants", 10)

    cat_enc = encoders["category"]
    brand_enc = encoders["brand"]

    cat_val = cat_enc.transform([category])[0] if category in cat_enc.classes_ else 0
    brand_val = brand_enc.transform([brand])[0] if brand in brand_enc.classes_ else 0

    features = np.array([[cat_val, brand_val, price, merchants]])
    predicted_sales = max(0, int(np.expm1(model.predict(features)[0])))

    # Find similar products
    similar = df[
        (df["category_name"] == category) &
        (df["sale_price"].between(price * 0.7, price * 1.3))
    ].sort_values("sale_qty", ascending=False).head(5)

    similar_products = [
        {
            "product_name": r["product_name"],
            "sale_price": int(r["sale_price"]),
            "sale_qty": int(r["sale_qty"]),
            "product_rate": float(r["product_rate"]),
            "image_url": r["image_url"],
        }
        for _, r in similar.iterrows()
    ]

    # Price recommendation
    cat_prices = df[df["category_name"] == category]["sale_price"]
    price_recommendation = {
        "min": int(cat_prices.quantile(0.1)),
        "median": int(cat_prices.median()),
        "max": int(cat_prices.quantile(0.9)),
        "optimal": int(cat_prices.quantile(0.4)),
    }

    return {
        "predicted_sales": predicted_sales,
        "similar_products": similar_products,
        "price_recommendation": price_recommendation,
    }


# --- PRODUCT DETAIL ---
@app.get("/api/product/{product_code}")
def get_product_detail(product_code: str):
    prod = df[df["product_code"].astype(str) == product_code]
    if prod.empty:
        return {"error": "Product not found"}
    row = prod.iloc[0]
    
    # Similar products (same category, similar price)
    price = int(row["sale_price"])
    similar = df[
        (df["category_name"] == row["category_name"]) &
        (df["product_code"].astype(str) != product_code) &
        (df["sale_price"].between(price * 0.5, price * 1.5))
    ].sort_values("sale_qty", ascending=False).head(8)
    
    similar_products = [
        {
            "product_code": str(r["product_code"]),
            "product_name": r["product_name"],
            "brand_name": r["brand_name"],
            "sale_price": int(r["sale_price"]),
            "product_rate": float(r["product_rate"]),
            "sale_qty": int(r["sale_qty"]),
            "image_url": r["image_url"],
        }
        for _, r in similar.iterrows()
    ]
    
    # ML prediction
    predicted_sales = None
    model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    encoders_path = os.path.join(os.path.dirname(__file__), "encoders.joblib")
    if os.path.exists(model_path) and os.path.exists(encoders_path):
        mdl = joblib.load(model_path)
        encoders = joblib.load(encoders_path)
        cat_enc = encoders["category"]
        brand_enc = encoders["brand"]
        cat_val = cat_enc.transform([row["category_name"]])[0] if row["category_name"] in cat_enc.classes_ else 0
        brand_val = brand_enc.transform([row["brand_name"]])[0] if row["brand_name"] in brand_enc.classes_ else 0
        features = np.array([[cat_val, brand_val, price, int(row["merchant_count"])]])
        predicted_sales = max(0, int(np.expm1(mdl.predict(features)[0])))
    
    return {
        "product_code": str(row["product_code"]),
        "product_name": row["product_name"],
        "brand_name": row["brand_name"],
        "category_name": row["category_name"],
        "parent_category": row["_category_name"],
        "sale_price": int(row["sale_price"]),
        "product_rate": float(row["product_rate"]),
        "review_qty": int(row["review_qty"]),
        "sale_qty": int(row["sale_qty"]),
        "sale_amount": int(row["sale_amount"]),
        "merchant_count": int(row["merchant_count"]),
        "amount_abc": int(row["amount_abc"]),
        "image_url": row["image_url"],
        "product_url": row.get("product_url", ""),
        "created_dt": str(row["created_dt"])[:10] if pd.notna(row["created_dt"]) else None,
        "last_sale_date": str(row["last_sale_date"])[:10] if pd.notna(row["last_sale_date"]) else None,
        "similar_products": similar_products,
        "predicted_sales": predicted_sales,
    }


# --- NICHE SEARCH ---
@app.get("/api/niches")
def get_niches(min_revenue: int = Query(0), max_merchants: int = Query(1000)):
    cat_stats = (
        df.groupby("category_name")
        .agg(
            revenue=("sale_amount", "sum"),
            products=("product_code", "count"),
            sold=("sale_qty", "sum"),
            avg_price=("sale_price", "mean"),
            avg_merchants=("merchant_count", "mean"),
            avg_rating=("product_rate", "mean"),
        )
        .reset_index()
    )
    cat_stats["avg_price"] = cat_stats["avg_price"].astype(int)
    cat_stats["avg_merchants"] = cat_stats["avg_merchants"].round(1)
    cat_stats["avg_rating"] = cat_stats["avg_rating"].round(2)
    
    # Filter
    filtered = cat_stats[
        (cat_stats["revenue"] >= min_revenue) &
        (cat_stats["avg_merchants"] <= max_merchants)
    ].sort_values("revenue", ascending=False)
    
    # Niche score: high revenue + low competition
    max_rev = filtered["revenue"].max() if len(filtered) > 0 else 1
    max_merch = filtered["avg_merchants"].max() if len(filtered) > 0 else 1
    filtered = filtered.copy()
    filtered["niche_score"] = (
        (filtered["revenue"] / max_rev) * 0.6 +
        (1 - filtered["avg_merchants"] / max_merch) * 0.4
    ).round(3)
    filtered = filtered.sort_values("niche_score", ascending=False)
    
    niches = [
        {
            "name": r["category_name"],
            "revenue": int(r["revenue"]),
            "products": int(r["products"]),
            "sold": int(r["sold"]),
            "avg_price": int(r["avg_price"]),
            "avg_merchants": float(r["avg_merchants"]),
            "avg_rating": float(r["avg_rating"]),
            "niche_score": float(r["niche_score"]),
        }
        for _, r in filtered.head(200).iterrows()
    ]
    
    return {"niches": niches, "total": len(filtered)}


# --- COMPETITION ANALYSIS ---
@app.get("/api/competition")
def get_competition():
    cat_comp = (
        df.groupby("category_name")
        .agg(
            avg_merchants=("merchant_count", "mean"),
            max_merchants=("merchant_count", "max"),
            products=("product_code", "count"),
            revenue=("sale_amount", "sum"),
            avg_price=("sale_price", "mean"),
        )
        .reset_index()
    )
    cat_comp["avg_merchants"] = cat_comp["avg_merchants"].round(1)
    cat_comp["avg_price"] = cat_comp["avg_price"].astype(int)
    
    # Top categories by competition
    top_competition = cat_comp.sort_values("avg_merchants", ascending=False).head(20)
    top_comp_data = [
        {"name": r["category_name"], "avg_merchants": float(r["avg_merchants"]), "products": int(r["products"]), "revenue": int(r["revenue"]), "avg_price": int(r["avg_price"])}
        for _, r in top_competition.iterrows()
    ]
    
    # Monopoly products (1 merchant, high sales)
    monopolies = df[df["merchant_count"] == 1].sort_values("sale_amount", ascending=False).head(20)
    monopoly_data = [
        {
            "product_code": str(r["product_code"]),
            "product_name": r["product_name"],
            "brand_name": r["brand_name"],
            "category_name": r["category_name"],
            "sale_price": int(r["sale_price"]),
            "sale_qty": int(r["sale_qty"]),
            "sale_amount": int(r["sale_amount"]),
            "product_rate": float(r["product_rate"]),
            "image_url": r["image_url"],
        }
        for _, r in monopolies.iterrows()
    ]
    
    # Scatter: avg_price vs avg_merchants per category
    scatter = [
        {"name": r["category_name"], "avg_price": int(r["avg_price"]), "avg_merchants": float(r["avg_merchants"]), "revenue": int(r["revenue"]), "products": int(r["products"])}
        for _, r in cat_comp.iterrows()
    ]
    
    # Merchant distribution
    bins = [0, 1, 2, 3, 5, 10, 20, 50, 100, 500]
    labels = ["1", "2", "3", "4-5", "6-10", "11-20", "21-50", "51-100", "100+"]
    merch_dist = pd.cut(df["merchant_count"], bins=bins, labels=labels, right=True).value_counts().sort_index()
    merchant_distribution = [{"range": k, "count": int(v)} for k, v in merch_dist.items()]
    
    return {
        "top_competition": top_comp_data,
        "monopolies": monopoly_data,
        "scatter": scatter,
        "merchant_distribution": merchant_distribution,
    }


# --- TIME ANALYSIS ---
@app.get("/api/time-analysis")
def get_time_analysis():
    # Products added by month
    added = df.dropna(subset=["created_dt"]).copy()
    added["month"] = added["created_dt"].dt.to_period("M").astype(str)
    by_month = added.groupby("month").agg(
        products=("product_code", "count"),
        revenue=("sale_amount", "sum"),
    ).reset_index().sort_values("month")
    products_by_month = [
        {"month": r["month"], "products": int(r["products"]), "revenue": int(r["revenue"])}
        for _, r in by_month.iterrows()
    ]
    
    # Weak products (sale_qty <= median/4 = low performers)
    sale_median = df["sale_qty"].median()
    weak_threshold = max(2, int(sale_median / 4))
    weak = df[df["sale_qty"] <= weak_threshold]
    strong = df[df["sale_qty"] > weak_threshold]
    
    weak_by_cat = weak.groupby("category_name").size().sort_values(ascending=False).head(15)
    dead_categories = [{"name": k, "count": int(v)} for k, v in weak_by_cat.items()]
    
    # Sales volume distribution
    bins_qty = [0, 1, 5, 20, 100, 500, df["sale_qty"].max() + 1]
    labels_qty = ["1 шт.", "2-5 шт.", "6-20 шт.", "21-100 шт.", "101-500 шт.", "500+ шт."]
    activity_dist = pd.cut(df["sale_qty"], bins=bins_qty, labels=labels_qty, right=True, include_lowest=True).value_counts().sort_index()
    activity_distribution = [{"range": k, "count": int(v)} for k, v in activity_dist.items()]
    
    # Products by day of week (created_dt)
    dow = added["created_dt"].dt.dayofweek
    dow_names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    dow_counts = dow.value_counts().sort_index()
    by_day_of_week = [{"day": dow_names[i], "count": int(dow_counts.get(i, 0))} for i in range(7)]
    
    return {
        "products_by_month": products_by_month,
        "dead_count": len(weak),
        "active_count": len(strong),
        "total_with_dates": len(df),
        "dead_categories": dead_categories,
        "activity_distribution": activity_distribution,
        "by_day_of_week": by_day_of_week,
        "weak_threshold": weak_threshold,
    }


# --- CORRELATION ---
@app.get("/api/correlation")
def get_correlation():
    cols = ["sale_price", "product_rate", "review_qty", "sale_qty", "merchant_count", "sale_amount"]
    labels_map = {
        "sale_price": "Цена",
        "product_rate": "Рейтинг",
        "review_qty": "Отзывы",
        "sale_qty": "Продажи",
        "merchant_count": "Продавцы",
        "sale_amount": "Выручка",
    }
    corr = df[cols].corr().round(3)
    
    matrix = []
    for i, row_name in enumerate(cols):
        for j, col_name in enumerate(cols):
            matrix.append({
                "x": labels_map[col_name],
                "y": labels_map[row_name],
                "value": float(corr.iloc[i, j]),
                "xi": j,
                "yi": i,
            })
    
    labels = [labels_map[c] for c in cols]
    
    return {"matrix": matrix, "labels": labels}


# --- GLOBAL SEARCH ---
@app.get("/api/search")
def global_search(q: str = Query(..., min_length=2)):
    q_lower = q.lower()
    
    # Search products (limit 10)
    prod_matches = df[
        df["product_name"].str.lower().str.contains(q_lower, na=False)
    ].sort_values("sale_amount", ascending=False).head(10)
    products = [
        {
            "product_code": str(r["product_code"]),
            "product_name": r["product_name"],
            "sale_price": int(r["sale_price"]),
            "image_url": r["image_url"],
            "type": "product",
        }
        for _, r in prod_matches.iterrows()
    ]
    
    # Search categories
    all_cats = df["category_name"].dropna().unique()
    cat_matches = [c for c in all_cats if q_lower in c.lower()][:8]
    categories = [{"name": c, "type": "category"} for c in cat_matches]
    
    # Search brands
    all_brands = df["brand_name"].dropna().unique()
    brand_matches = [b for b in all_brands if q_lower in b.lower()][:8]
    brands = [{"name": b, "type": "brand"} for b in brand_matches]
    
    return {"products": products, "categories": categories, "brands": brands}


# --- PRODUCT COMPARISON ---
@app.get("/api/products/compare")
def compare_products(codes: str = Query(..., description="Comma-separated product codes")):
    code_list = [c.strip() for c in codes.split(",")][:5]
    result = []
    for code in code_list:
        prod = df[df["product_code"].astype(str) == code]
        if prod.empty:
            continue
        r = prod.iloc[0]
        result.append({
            "product_code": str(r["product_code"]),
            "product_name": r["product_name"],
            "brand_name": r["brand_name"],
            "category_name": r["category_name"],
            "sale_price": int(r["sale_price"]),
            "product_rate": float(r["product_rate"]),
            "review_qty": int(r["review_qty"]),
            "sale_qty": int(r["sale_qty"]),
            "sale_amount": int(r["sale_amount"]),
            "merchant_count": int(r["merchant_count"]),
            "amount_abc": int(r["amount_abc"]),
            "image_url": r["image_url"],
        })
    return result


# --- EXPORT ---
@app.get("/api/export/products")
def export_products(
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    search: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    abc: Optional[int] = None,
):
    filtered = df.copy()
    if search:
        search_lower = search.lower()
        filtered = filtered[
            filtered["product_name"].str.lower().str.contains(search_lower, na=False)
            | filtered["brand_name"].str.lower().str.contains(search_lower, na=False)
        ]
    if category:
        filtered = filtered[filtered["category_name"] == category]
    if brand:
        filtered = filtered[filtered["brand_name"] == brand]
    if abc is not None:
        filtered = filtered[filtered["amount_abc"] == abc]
    
    export_cols = ["product_name", "brand_name", "category_name", "sale_price", "product_rate", "review_qty", "sale_qty", "sale_amount", "merchant_count"]
    export_df = filtered[export_cols].head(50000)
    export_df.columns = ["Название", "Бренд", "Категория", "Цена", "Рейтинг", "Отзывы", "Продано", "Выручка", "Продавцы"]
    
    if format == "xlsx":
        buf = io.BytesIO()
        export_df.to_excel(buf, index=False, engine="openpyxl")
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": "attachment; filename=kaspi_products.xlsx"})
    else:
        buf = io.StringIO()
        export_df.to_csv(buf, index=False, encoding="utf-8-sig")
        buf.seek(0)
        return StreamingResponse(io.BytesIO(buf.getvalue().encode("utf-8-sig")), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=kaspi_products.csv"})


# --- PRICE CALCULATOR ---
@app.get("/api/price-calculator")
def price_calculator(category: str = Query(...), brand: str = Query("")):
    cat_df = df[df["category_name"] == category].copy()
    if brand:
        brand_df = cat_df[cat_df["brand_name"] == brand]
    else:
        brand_df = cat_df

    if len(cat_df) == 0:
        return {"error": "Категория не найдена"}

    # Price distribution in category - split into 12 bins
    prices = cat_df["sale_price"]
    min_p, max_p = int(prices.min()), int(prices.max())
    if max_p <= min_p:
        max_p = min_p + 1000

    n_bins = 12
    bin_edges = np.linspace(min_p, max_p, n_bins + 1).astype(int)
    
    price_segments = []
    for i in range(n_bins):
        low, high = int(bin_edges[i]), int(bin_edges[i + 1])
        seg = cat_df[(cat_df["sale_price"] >= low) & (cat_df["sale_price"] < high)]
        products = len(seg)
        revenue = int(seg["sale_amount"].sum())
        avg_merchants = round(float(seg["merchant_count"].mean()), 1) if products > 0 else 0
        avg_rating = round(float(seg["product_rate"].mean()), 2) if products > 0 else 0
        total_sold = int(seg["sale_qty"].sum()) if products > 0 else 0
        
        price_segments.append({
            "range": f"{low//1000}K-{high//1000}K" if high >= 1000 else f"{low}-{high}",
            "low": low,
            "high": high,
            "products": products,
            "revenue": revenue,
            "avg_merchants": avg_merchants,
            "avg_rating": avg_rating,
            "total_sold": total_sold,
        })

    # Find gaps (segments with low competition but demand in nearby segments)
    gaps = []
    for i, seg in enumerate(price_segments):
        # Nearby demand: sum revenue from adjacent segments
        nearby_revenue = 0
        nearby_products = 0
        for j in range(max(0, i - 1), min(n_bins, i + 2)):
            nearby_revenue += price_segments[j]["revenue"]
            nearby_products += price_segments[j]["products"]
        
        # Score: low products + high nearby revenue = good gap
        if nearby_products > 0:
            competition_score = seg["products"] / nearby_products
        else:
            competition_score = 1
        
        demand_score = nearby_revenue
        gap_score = (1 - competition_score) * (demand_score / max(1, max(s["revenue"] for s in price_segments)))
        
        gaps.append({
            **seg,
            "gap_score": round(gap_score, 3),
        })
    
    gaps.sort(key=lambda x: x["gap_score"], reverse=True)

    # Brand stats in this category
    brand_stats = None
    if brand and len(brand_df) > 0:
        brand_stats = {
            "products": len(brand_df),
            "avg_price": int(brand_df["sale_price"].mean()),
            "min_price": int(brand_df["sale_price"].min()),
            "max_price": int(brand_df["sale_price"].max()),
            "total_revenue": int(brand_df["sale_amount"].sum()),
            "total_sold": int(brand_df["sale_qty"].sum()),
            "avg_rating": round(float(brand_df["product_rate"].mean()), 2),
        }

    # Category stats
    cat_stats = {
        "total_products": len(cat_df),
        "avg_price": int(cat_df["sale_price"].mean()),
        "median_price": int(cat_df["sale_price"].median()),
        "total_revenue": int(cat_df["sale_amount"].sum()),
        "avg_merchants": round(float(cat_df["merchant_count"].mean()), 1),
        "avg_rating": round(float(cat_df["product_rate"].mean()), 2),
    }

    # Top 5 competitors (brands) in category
    top_brands = (cat_df.groupby("brand_name")
                  .agg(revenue=("sale_amount", "sum"), products=("product_code", "count"), avg_price=("sale_price", "mean"))
                  .sort_values("revenue", ascending=False)
                  .head(5)
                  .reset_index())
    competitors = [
        {"name": r["brand_name"], "revenue": int(r["revenue"]), "products": int(r["products"]), "avg_price": int(r["avg_price"])}
        for _, r in top_brands.iterrows()
    ]

    return {
        "category": category,
        "brand": brand,
        "cat_stats": cat_stats,
        "brand_stats": brand_stats,
        "price_segments": price_segments,
        "gaps": gaps[:5],
        "competitors": competitors,
    }


# --- ABC PARETO ---
@app.get("/api/abc-pareto")
def abc_pareto():
    # Sort all products by revenue descending
    sorted_df = df[["product_name", "brand_name", "category_name", "sale_amount", "sale_qty", "sale_price"]].copy()
    sorted_df = sorted_df.sort_values("sale_amount", ascending=False).reset_index(drop=True)
    
    total_revenue = sorted_df["sale_amount"].sum()
    sorted_df["cumulative_revenue"] = sorted_df["sale_amount"].cumsum()
    sorted_df["cumulative_pct"] = (sorted_df["cumulative_revenue"] / total_revenue * 100).round(2)
    sorted_df["product_pct"] = ((sorted_df.index + 1) / len(sorted_df) * 100).round(4)

    # Pareto curve - sample ~200 points for the chart
    n = len(sorted_df)
    step = max(1, n // 200)
    pareto_points = []
    for i in range(0, n, step):
        pareto_points.append({
            "product_pct": round(float(sorted_df.iloc[i]["product_pct"]), 2),
            "revenue_pct": round(float(sorted_df.iloc[i]["cumulative_pct"]), 2),
        })
    # Always include last point
    pareto_points.append({"product_pct": 100.0, "revenue_pct": 100.0})

    # Key thresholds
    pct_80 = sorted_df[sorted_df["cumulative_pct"] >= 80].iloc[0]["product_pct"] if len(sorted_df[sorted_df["cumulative_pct"] >= 80]) > 0 else 100
    pct_95 = sorted_df[sorted_df["cumulative_pct"] >= 95].iloc[0]["product_pct"] if len(sorted_df[sorted_df["cumulative_pct"] >= 95]) > 0 else 100
    
    # ABC breakdown
    abc_counts = df["amount_abc"].value_counts().sort_index()
    abc_revenue = df.groupby("amount_abc")["sale_amount"].sum().sort_index()
    total_products = len(df)
    
    abc_breakdown = []
    for abc_class, label, color in [(1, "A — Лидеры", "#22C55E"), (2, "B — Средние", "#F59E0B"), (3, "C — Аутсайдеры", "#EF4444")]:
        count = int(abc_counts.get(abc_class, 0))
        revenue = int(abc_revenue.get(abc_class, 0))
        abc_breakdown.append({
            "label": label,
            "class": abc_class,
            "color": color,
            "count": count,
            "count_pct": round(count / total_products * 100, 1),
            "revenue": revenue,
            "revenue_pct": round(revenue / total_revenue * 100, 1) if total_revenue > 0 else 0,
        })

    # Top 10 products by revenue
    top10 = sorted_df.head(10)
    top_products = [
        {
            "name": r["product_name"][:60],
            "brand": r["brand_name"],
            "category": r["category_name"],
            "revenue": int(r["sale_amount"]),
            "revenue_pct": round(float(r["sale_amount"]) / total_revenue * 100, 3),
            "sold": int(r["sale_qty"]),
            "price": int(r["sale_price"]),
        }
        for _, r in top10.iterrows()
    ]

    return {
        "pareto_points": pareto_points,
        "pct_80": round(float(pct_80), 2),
        "pct_95": round(float(pct_95), 2),
        "total_products": total_products,
        "total_revenue": int(total_revenue),
        "abc_breakdown": abc_breakdown,
        "top_products": top_products,
    }


# --- RECOMMENDER ---
@app.get("/api/recommender")
def recommender():
    # Analyze each category for entry potential
    cat_stats = df.groupby("category_name").agg(
        revenue=("sale_amount", "sum"),
        products=("product_code", "count"),
        sold=("sale_qty", "sum"),
        avg_price=("sale_price", "mean"),
        avg_merchants=("merchant_count", "mean"),
        avg_rating=("product_rate", "mean"),
        total_reviews=("review_qty", "sum"),
    ).reset_index()

    # Filter out tiny categories
    cat_stats = cat_stats[cat_stats["products"] >= 5].copy()
    
    if len(cat_stats) == 0:
        return {"recommendations": [], "total_categories": 0}

    # Normalize metrics to 0-100 scale
    def norm(series):
        mn, mx = series.min(), series.max()
        if mx == mn:
            return pd.Series([50] * len(series), index=series.index)
        return ((series - mn) / (mx - mn) * 100).round(1)

    # High revenue = good demand
    cat_stats["demand_score"] = norm(cat_stats["revenue"])
    
    # Low merchants = less competition (invert)
    cat_stats["competition_score"] = (100 - norm(cat_stats["avg_merchants"])).round(1)
    
    # High avg_price = better margins
    cat_stats["margin_score"] = norm(cat_stats["avg_price"])
    
    # Revenue per product = market efficiency
    cat_stats["rev_per_product"] = cat_stats["revenue"] / cat_stats["products"]
    cat_stats["efficiency_score"] = norm(cat_stats["rev_per_product"])
    
    # High rating = customer satisfaction
    cat_stats["rating_score"] = norm(cat_stats["avg_rating"])
    
    # Composite entry score (weighted)
    cat_stats["entry_score"] = (
        cat_stats["demand_score"] * 0.30 +
        cat_stats["competition_score"] * 0.25 +
        cat_stats["margin_score"] * 0.15 +
        cat_stats["efficiency_score"] * 0.20 +
        cat_stats["rating_score"] * 0.10
    ).round(1)

    # Sort by entry score
    cat_stats = cat_stats.sort_values("entry_score", ascending=False)

    recommendations = []
    for _, r in cat_stats.head(15).iterrows():
        recommendations.append({
            "category": r["category_name"],
            "entry_score": round(float(r["entry_score"]), 1),
            "demand_score": round(float(r["demand_score"]), 1),
            "competition_score": round(float(r["competition_score"]), 1),
            "margin_score": round(float(r["margin_score"]), 1),
            "efficiency_score": round(float(r["efficiency_score"]), 1),
            "revenue": int(r["revenue"]),
            "products": int(r["products"]),
            "avg_price": int(r["avg_price"]),
            "avg_merchants": round(float(r["avg_merchants"]), 1),
            "avg_rating": round(float(r["avg_rating"]), 2),
            "sold": int(r["sold"]),
        })

    # Category scatter data for chart
    scatter = []
    for _, r in cat_stats.head(100).iterrows():
        scatter.append({
            "name": r["category_name"],
            "demand": round(float(r["demand_score"]), 1),
            "competition": round(float(r["competition_score"]), 1),
            "entry_score": round(float(r["entry_score"]), 1),
            "revenue": int(r["revenue"]),
        })

    # Score distribution
    bins = [0, 20, 40, 60, 80, 100]
    labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
    dist = pd.cut(cat_stats["entry_score"], bins=bins, labels=labels, right=True).value_counts().sort_index()
    score_distribution = [{"range": k, "count": int(v)} for k, v in dist.items()]

    return {
        "recommendations": recommendations,
        "total_categories": len(cat_stats),
        "scatter": scatter,
        "score_distribution": score_distribution,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

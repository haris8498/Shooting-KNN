"""
Improved Aircraft Classification Dataset Generator
====================================================
Key improvements over v1:
  - 3000 samples (3x more data)
  - 4 realistic aircraft sub-types with correlated features
  - Normal/clipped distributions instead of pure uniform (realistic sensor readings)
  - Gaussian noise on all sensors (simulates measurement error)
  - Balanced classes (50/50 Enemy/Friendly)
  - Realistic feature correlations (high speed -> high heat, etc.)

Sub-types:
  Enemy:    Fighter Jet | Stealth Drone
  Friendly: Commercial Airliner | Military Transport
"""

import pandas as pd
import numpy as np
import os

np.random.seed(None)  # fully random each run

def clip(value, lo, hi):
    return float(np.clip(value, lo, hi))

def normal(mean, std, lo, hi):
    """Gaussian sample clipped to a realistic physical range."""
    return clip(np.random.normal(mean, std), lo, hi)

def add_sensor_noise(value, noise_std, lo, hi):
    """Simulate sensor measurement error."""
    return clip(value + np.random.normal(0, noise_std), lo, hi)


# ── AIRCRAFT PROFILES ──────────────────────────────────────────────────────────
# Each profile is a dict of (mean, std, min, max) per feature.
# Features: Altitude(ft), Speed(km/h), Distance(km), Size(m), Angle(°),
#           Radar_Signal(0-1), Heat_Signature(0-1)

PROFILES = {

    # ── ENEMY ──────────────────────────────────────────────────────────────────
    "Fighter Jet": {
        # Low altitude attack run, very fast, small, high signatures
        "label":            "Enemy",
        "altitude":         (800,   600,  200,  6000),
        "speed":            (1200,  200,  700,  1800),
        "distance":         (30,    20,   5,    80),
        "size":             (12,    4,    6,    22),
        "radar_signal":     (0.82,  0.10, 0.55, 1.0),
        "heat_signature":   (0.85,  0.08, 0.60, 1.0),
        "weight":           0.30,   # 30% of enemy samples
    },
    "Stealth Drone": {
        # Medium altitude, slower, small, LOW signatures (hard to detect!)
        "label":            "Enemy",
        "altitude":         (3500,  800,  1000, 7000),
        "speed":            (450,   100,  250,  700),
        "distance":         (45,    25,   10,   90),
        "size":             (4,     2,    1,    9),
        "radar_signal":     (0.30,  0.10, 0.10, 0.58),  # deliberately low → hard to classify
        "heat_signature":   (0.28,  0.10, 0.10, 0.55),  # deliberately low → overlaps friendly
        "weight":           0.20,   # 20% of enemy samples (rarer, harder)
    },

    # ── FRIENDLY ───────────────────────────────────────────────────────────────
    "Commercial Airliner": {
        # High altitude, medium-high speed, large, medium signatures
        "label":            "Friendly",
        "altitude":         (10000, 1500, 5000, 13000),
        "speed":            (850,   80,   600,  1050),
        "distance":         (50,    25,   10,   90),
        "size":             (55,    15,   30,   90),
        "radar_signal":     (0.45,  0.10, 0.20, 0.70),  # overlaps with stealth drone
        "heat_signature":   (0.35,  0.08, 0.15, 0.58),  # overlaps with stealth drone
        "weight":           0.30,
    },
    "Military Transport": {
        # Medium altitude, slower, large, somewhat higher signatures
        "label":            "Friendly",
        "altitude":         (5000,  1200, 2000, 9000),
        "speed":            (550,   100,  350,  800),
        "distance":         (40,    22,   5,    85),
        "size":             (40,    10,   20,   65),
        "radar_signal":     (0.55,  0.10, 0.30, 0.78),  # overlaps with fighter jet
        "heat_signature":   (0.48,  0.09, 0.25, 0.72),  # overlaps with fighter jet
        "weight":           0.20,
    },
}

# Sensor noise levels (std of Gaussian noise added after sampling)
NOISE = {
    "altitude":       150,
    "speed":          30,
    "distance":       3,
    "size":           0.5,
    "radar_signal":   0.03,
    "heat_signature": 0.03,
}


def sample_aircraft(profile_name: str) -> dict:
    p = PROFILES[profile_name]
    
    alt   = normal(*p["altitude"])
    spd   = normal(*p["speed"])
    dist  = normal(*p["distance"])
    size  = normal(*p["size"])
    angle = float(np.random.uniform(0, 360))
    rsig  = normal(*p["radar_signal"])
    heat  = normal(*p["heat_signature"])

    # Realistic correlations:
    # Higher speed → slightly higher heat and radar (aerodynamic heating, engine output)
    speed_factor = (spd - 400) / 1400.0  # normalised 0–1
    rsig  = clip(rsig  + speed_factor * 0.08, 0.05, 1.0)
    heat  = clip(heat  + speed_factor * 0.10, 0.05, 1.0)

    # Lower altitude → slightly higher radar cross-section (terrain bounce)
    alt_factor = 1.0 - min(alt / 13000.0, 1.0)
    rsig  = clip(rsig  + alt_factor * 0.05, 0.05, 1.0)

    # Add sensor noise
    alt   = add_sensor_noise(alt,  NOISE["altitude"],       100, 15000)
    spd   = add_sensor_noise(spd,  NOISE["speed"],          100, 2000)
    dist  = add_sensor_noise(dist, NOISE["distance"],       1,   100)
    size  = add_sensor_noise(size, NOISE["size"],           0.5, 100)
    rsig  = add_sensor_noise(rsig, NOISE["radar_signal"],   0.01, 1.0)
    heat  = add_sensor_noise(heat, NOISE["heat_signature"], 0.01, 1.0)

    return {
        "Altitude":            round(alt,  1),
        "Speed":               round(spd,  1),
        "Distance_From_Base":  round(dist, 2),
        "Plane_Size":          round(size, 2),
        "Direction_Angle":     round(angle, 1),
        "Radar_Signal":        round(rsig, 4),
        "Heat_Signature":      round(heat, 4),
        "Label":               p["label"],
        "Sub_Type":            profile_name,
    }


def generate_dataset(num_samples: int = 3000, include_subtype: bool = False) -> pd.DataFrame:
    """
    Generate a balanced, realistic aircraft classification dataset.

    Args:
        num_samples:     Total number of rows.
        include_subtype: If True, keeps the Sub_Type column (useful for analysis).
                         The ML model only uses the 7 feature columns + Label.
    """
    # Half enemy, half friendly
    half = num_samples // 2

    # Enemy: 60% Fighter Jet, 40% Stealth Drone
    n_fighter = int(half * 0.60)
    n_drone   = half - n_fighter

    # Friendly: 60% Commercial, 40% Military Transport
    n_commercial  = int(half * 0.60)
    n_transport   = half - n_commercial

    records = []
    for _ in range(n_fighter):    records.append(sample_aircraft("Fighter Jet"))
    for _ in range(n_drone):      records.append(sample_aircraft("Stealth Drone"))
    for _ in range(n_commercial): records.append(sample_aircraft("Commercial Airliner"))
    for _ in range(n_transport):  records.append(sample_aircraft("Military Transport"))

    df = pd.DataFrame(records)
    df = df.sample(frac=1, random_state=None).reset_index(drop=True)  # shuffle

    if not include_subtype:
        df = df.drop(columns=["Sub_Type"])

    return df


def print_stats(df: pd.DataFrame):
    print("\n── Dataset Statistics ─────────────────────────────")
    print(f"  Total samples : {len(df)}")
    print(f"  Class balance : {df['Label'].value_counts().to_dict()}")
    print("\n  Feature means by class:")
    numeric_cols = ["Altitude", "Speed", "Distance_From_Base",
                    "Plane_Size", "Radar_Signal", "Heat_Signature"]
    print(df.groupby("Label")[numeric_cols].mean().round(2).to_string())
    print("\n  Feature ranges (min / max):")
    print(df[numeric_cols].agg(["min", "max"]).round(2).to_string())
    print("───────────────────────────────────────────────────\n")


if __name__ == "__main__":
    print("Generating improved aircraft dataset...")
    df = generate_dataset(num_samples=3000, include_subtype=False)
    print_stats(df)

    output_path = "../plane_knn_dataset.xlsx"
    df.to_excel(output_path, index=False)
    print(f"✓ Dataset saved → {output_path}  ({len(df)} rows × {len(df.columns)} cols)")

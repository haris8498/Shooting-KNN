import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import numpy as np

class KNNModel:
    def __init__(self, data_path="../plane_knn_dataset.xlsx"):
        self.data_path = data_path
        self.df = None
        self.model = None
        self.scaler = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.metrics = {}
        
        self.k = 5
        self.test_size = 0.2
        self.metric = "euclidean"
        
        self.load_data()
        self.train_model()
        
    def load_data(self):
        try:
            self.df = pd.read_excel(self.data_path)
        except Exception as e:
            print(f"Error loading data: {e}")
            
    def train_model(self, k=None, test_size=None, metric=None):
        if k: self.k = k
        if test_size: self.test_size = test_size
        if metric: self.metric = metric
        
        self.load_data() # Force reload the dataset from disk
        
        if self.df is None: return False
        
        X = self.df.drop("Label", axis=1)
        y = self.df["Label"]
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=self.test_size, random_state=42
        )
        
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(self.X_train)
        X_test_scaled = self.scaler.transform(self.X_test)
        
        self.model = KNeighborsClassifier(n_neighbors=self.k, metric=self.metric)
        self.model.fit(X_train_scaled, self.y_train)
        
        y_pred = self.model.predict(X_test_scaled)
        
        self.metrics = {
            "accuracy": accuracy_score(self.y_test, y_pred),
            "precision": precision_score(self.y_test, y_pred, pos_label="Enemy", zero_division=0),
            "recall": recall_score(self.y_test, y_pred, pos_label="Enemy", zero_division=0),
            "f1_score": f1_score(self.y_test, y_pred, pos_label="Enemy", zero_division=0),
            "confusion_matrix": confusion_matrix(self.y_test, y_pred).tolist()
        }
        
        return True
        
    def predict(self, features):
        if self.model is None or self.scaler is None: return None
        
        features_scaled = self.scaler.transform([features])
        
        prediction = self.model.predict(features_scaled)[0]
        proba = self.model.predict_proba(features_scaled)[0]
        confidence = max(proba)
        
        distances, indices = self.model.kneighbors(features_scaled)
        
        neighbors = []
        for i, idx in enumerate(indices[0]):
            neighbor_class = self.y_train.iloc[idx]
            dist = distances[0][i]
            neighbors.append({
                "class": str(neighbor_class),
                "distance": float(dist)
            })
            
        return {
            "prediction": str(prediction),
            "confidence": float(confidence),
            "neighbors": neighbors
        }

    def get_random_plane(self):
        if self.df is None or len(self.df) == 0:
            return None
        
        # Pick a random row
        sample = self.df.sample(n=1).iloc[0]
        is_enemy = sample["Label"] == "Enemy"
        
        features = {
            "Altitude": float(sample["Altitude"]),
            "Speed": float(sample["Speed"]),
            "Distance_From_Base": float(sample["Distance_From_Base"]),
            "Plane_Size": float(sample["Plane_Size"]),
            "Direction_Angle": float(sample["Direction_Angle"]),
            "Radar_Signal": float(sample["Radar_Signal"]),
            "Heat_Signature": float(sample["Heat_Signature"])
        }
        
        return {
            "isEnemy": is_enemy,
            "features": features
        }

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from classifiers import ClassifierFactory
import numpy as np

class ClassifierManager:
    def __init__(self, data_path="../plane_knn_dataset.xlsx"):
        self.data_path = data_path
        self.df = None
        self.classifier = None
        self.scaler = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.metrics = {}
        self.current_classifier_type = "knn"
        
        # Default parameters
        self.test_size = 0.2
        self.knn_k = 5
        self.knn_metric = "euclidean"
        self.svm_kernel = "rbf"
        self.svm_C = 1.0
        
        self.load_data()
        self.train_model()
        
    def load_data(self):
        try:
            self.df = pd.read_excel(self.data_path)
        except Exception as e:
            print(f"Error loading data: {e}")
            
    def train_model(self, classifier_type=None, test_size=None, k=None, metric=None, svm_kernel=None, svm_C=None):
        if classifier_type:
            self.current_classifier_type = classifier_type
        if test_size:
            self.test_size = test_size
        if k:
            self.knn_k = k
        if metric:
            self.knn_metric = metric
        if svm_kernel:
            self.svm_kernel = svm_kernel
        if svm_C:
            self.svm_C = svm_C
        
        self.load_data()  # Force reload dataset from disk
        
        if self.df is None:
            return False
        
        X = self.df.drop("Label", axis=1)
        y = self.df["Label"]
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=self.test_size, random_state=42
        )
        
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(self.X_train)
        X_test_scaled = self.scaler.transform(self.X_test)
        
        # Create classifier based on type
        if self.current_classifier_type.lower() == "knn":
            self.classifier = ClassifierFactory.create("knn", k=self.knn_k, metric=self.knn_metric)
        elif self.current_classifier_type.lower() == "naive_bayes":
            self.classifier = ClassifierFactory.create("naive_bayes")
        elif self.current_classifier_type.lower() == "svm":
            self.classifier = ClassifierFactory.create("svm", kernel=self.svm_kernel, C=self.svm_C)
        else:
            self.classifier = ClassifierFactory.create("knn", k=self.knn_k, metric=self.knn_metric)
        
        self.classifier.fit(X_train_scaled, self.y_train)
        
        y_pred = self.classifier.predict(X_test_scaled)
        
        self.metrics = {
            "classifier": self.current_classifier_type,
            **self.classifier.get_metrics(self.y_test, y_pred)
        }
        
        return True
        
    def predict(self, features):
        if self.classifier is None or self.scaler is None:
            return None
        
        features_scaled = self.scaler.transform([features])
        
        prediction = self.classifier.predict(features_scaled)[0]
        proba = self.classifier.predict_proba(features_scaled)[0]
        confidence = max(proba)
        
        result = {
            "prediction": str(prediction),
            "confidence": float(confidence),
            "classifier": self.current_classifier_type
        }
        
        # Add neighbors info only for KNN
        if self.current_classifier_type.lower() == "knn":
            neighbors = self.classifier.get_neighbors(features_scaled)
            result["neighbors"] = neighbors
        else:
            result["neighbors"] = []
            
        return result

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

    def compare_all_classifiers(self):
        """Train and evaluate all classifiers, return comparison metrics"""
        if self.df is None:
            return None
        
        # Use current train/test split
        X = self.df.drop("Label", axis=1)
        y = self.df["Label"]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.test_size, random_state=42
        )
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        results = {}
        
        # Train KNN
        try:
            knn = ClassifierFactory.create("knn", k=self.knn_k, metric=self.knn_metric)
            knn.fit(X_train_scaled, y_train)
            y_pred_knn = knn.predict(X_test_scaled)
            results["knn"] = {
                "classifier": "knn",
                **knn.get_metrics(y_test, y_pred_knn),
                "params": {"k": self.knn_k, "metric": self.knn_metric}
            }
        except Exception as e:
            results["knn"] = {"error": str(e)}
        
        # Train Naive Bayes
        try:
            nb = ClassifierFactory.create("naive_bayes")
            nb.fit(X_train_scaled, y_train)
            y_pred_nb = nb.predict(X_test_scaled)
            results["naive_bayes"] = {
                "classifier": "naive_bayes",
                **nb.get_metrics(y_test, y_pred_nb),
                "params": {}
            }
        except Exception as e:
            results["naive_bayes"] = {"error": str(e)}
        
        # Train SVM
        try:
            svm = ClassifierFactory.create("svm", kernel=self.svm_kernel, C=self.svm_C)
            svm.fit(X_train_scaled, y_train)
            y_pred_svm = svm.predict(X_test_scaled)
            results["svm"] = {
                "classifier": "svm",
                **svm.get_metrics(y_test, y_pred_svm),
                "params": {"kernel": self.svm_kernel, "C": self.svm_C}
            }
        except Exception as e:
            results["svm"] = {"error": str(e)}
        
        return results

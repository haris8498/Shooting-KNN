from abc import ABC, abstractmethod
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import numpy as np


class BaseClassifier(ABC):
    """Abstract base class for all classifiers"""
    
    def __init__(self, name):
        self.name = name
        self.model = None
    
    @abstractmethod
    def fit(self, X_train, y_train):
        pass
    
    @abstractmethod
    def predict(self, X_test):
        pass
    
    @abstractmethod
    def predict_proba(self, X_test):
        pass
    
    def get_metrics(self, y_test, y_pred):
        """Calculate metrics for any classifier"""
        return {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, pos_label="Enemy", zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, pos_label="Enemy", zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred, pos_label="Enemy", zero_division=0)),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
        }


class KNNClassifier(BaseClassifier):
    """K-Nearest Neighbors Classifier"""
    
    def __init__(self, k=5, metric="euclidean"):
        super().__init__("KNN")
        self.k = k
        self.metric = metric
        self.model = KNeighborsClassifier(n_neighbors=self.k, metric=self.metric)
        self.X_train = None
        self.y_train = None
    
    def fit(self, X_train, y_train):
        self.X_train = X_train
        self.y_train = y_train
        self.model.fit(X_train, y_train)
    
    def predict(self, X_test):
        return self.model.predict(X_test)
    
    def predict_proba(self, X_test):
        return self.model.predict_proba(X_test)
    
    def get_neighbors(self, X_test):
        """Get k-nearest neighbors with distances"""
        distances, indices = self.model.kneighbors(X_test)
        neighbors = []
        for i, idx in enumerate(indices[0]):
            neighbor_class = self.y_train.iloc[idx]
            dist = distances[0][i]
            neighbors.append({
                "class": str(neighbor_class),
                "distance": float(dist)
            })
        return neighbors


class NaiveBayesClassifier(BaseClassifier):
    """Gaussian Naive Bayes Classifier"""
    
    def __init__(self):
        super().__init__("Naive Bayes")
        self.model = GaussianNB()
    
    def fit(self, X_train, y_train):
        self.model.fit(X_train, y_train)
    
    def predict(self, X_test):
        return self.model.predict(X_test)
    
    def predict_proba(self, X_test):
        return self.model.predict_proba(X_test)


class SVMClassifier(BaseClassifier):
    """Support Vector Machine Classifier"""
    
    def __init__(self, kernel="rbf", C=1.0):
        super().__init__("SVM")
        self.kernel = kernel
        self.C = C
        self.model = SVC(kernel=self.kernel, C=self.C, probability=True, random_state=42)
    
    def fit(self, X_train, y_train):
        self.model.fit(X_train, y_train)
    
    def predict(self, X_test):
        return self.model.predict(X_test)
    
    def predict_proba(self, X_test):
        return self.model.predict_proba(X_test)


class ClassifierFactory:
    """Factory for creating and managing classifiers"""
    
    @staticmethod
    def create(classifier_type, **kwargs):
        """Create a classifier instance"""
        if classifier_type.lower() == "knn":
            k = kwargs.get("k", 5)
            metric = kwargs.get("metric", "euclidean")
            return KNNClassifier(k=k, metric=metric)
        elif classifier_type.lower() == "naive_bayes":
            return NaiveBayesClassifier()
        elif classifier_type.lower() == "svm":
            kernel = kwargs.get("kernel", "rbf")
            C = kwargs.get("C", 1.0)
            return SVMClassifier(kernel=kernel, C=C)
        else:
            raise ValueError(f"Unknown classifier type: {classifier_type}")

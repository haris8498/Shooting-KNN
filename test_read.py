import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score

print("Loading dataset...")
df = pd.read_excel('plane_knn_dataset.xlsx')
print(f"Dataset shape: {df.shape}")
print(df.head())

X = df.drop("Label", axis=1)
y = df["Label"]
        
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
        
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
        
model = KNeighborsClassifier(n_neighbors=5, metric="euclidean")
model.fit(X_train_scaled, y_train)
        
y_pred = model.predict(X_test_scaled)
acc = accuracy_score(y_test, y_pred)
print(f"Accuracy: {acc}")

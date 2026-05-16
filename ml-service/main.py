from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ml_model import ClassifierManager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = ClassifierManager()

class TrainParams(BaseModel):
    classifier: str = "knn"  # New parameter for classifier selection
    k: int = None
    metric: str = None
    svm_kernel: str = None
    svm_C: float = None
    test_size: float = None

class PredictParams(BaseModel):
    Altitude: float
    Speed: float
    Distance_From_Base: float
    Plane_Size: float
    Direction_Angle: float
    Radar_Signal: float
    Heat_Signature: float

@app.post("/train")
def train(params: TrainParams):
    success = model.train_model(
        classifier_type=params.classifier,
        test_size=params.test_size,
        k=params.k,
        metric=params.metric,
        svm_kernel=params.svm_kernel,
        svm_C=params.svm_C
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to train model")
    return {"message": f"Model trained successfully with {params.classifier}", "metrics": model.metrics}

@app.post("/predict")
def predict(params: PredictParams):
    features = [
        params.Altitude,
        params.Speed,
        params.Distance_From_Base,
        params.Plane_Size,
        params.Direction_Angle,
        params.Radar_Signal,
        params.Heat_Signature
    ]
    result = model.predict(features)
    if not result:
        raise HTTPException(status_code=500, detail="Model not initialized")
    return result

@app.get("/metrics")
def get_metrics():
    return model.metrics

@app.post("/settings")
def update_settings(params: TrainParams):
    return train(params)

@app.get("/random_plane")
def get_random_plane():
    result = model.get_random_plane()
    if not result:
        raise HTTPException(status_code=404, detail="No dataset loaded")
    return result

@app.get("/classifiers")
def get_available_classifiers():
    return {
        "classifiers": ["knn", "naive_bayes", "svm"],
        "current": model.current_classifier_type
    }

@app.get("/compare")
def compare_classifiers():
    results = model.compare_all_classifiers()
    if not results:
        raise HTTPException(status_code=500, detail="Failed to compare classifiers")
    return {"comparisons": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

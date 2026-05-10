from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ml_model import KNNModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = KNNModel()

class TrainParams(BaseModel):
    k: int = None
    test_size: float = None
    metric: str = None

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
    success = model.train_model(k=params.k, test_size=params.test_size, metric=params.metric)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to train model")
    return {"message": "Model trained successfully", "metrics": model.metrics}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

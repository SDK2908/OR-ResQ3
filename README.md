# OR-ResQ

### Dynamic Operating Room Optimization & Emergency Recovery Engine

> **OR-ResQ is a software-based operating room optimization system that dynamically recovers surgical schedules when emergency procedures interrupt planned operations — while minimizing unnecessary disruption to the existing schedule.**

---

## 🚨 The Problem

Operating rooms are planned around multiple constraints:

* Operating room availability
* Surgeon availability
* Procedure duration
* Equipment requirements
* Patient priority
* Existing scheduled procedures

The difficult part begins when an **emergency procedure suddenly arrives**.

A static schedule is no longer valid.

Simply inserting the emergency case can create a chain reaction:

**Emergency Case → Schedule Conflict → Delays → OR/Surgeon Conflicts → Multiple Rescheduling Changes**

OR-ResQ addresses this as a **dynamic recovery problem**, not just a scheduling problem.

---

# 💡 Our Solution

OR-ResQ continuously evaluates the current operating-room schedule and provides a recovery plan when an emergency case interrupts it.

### Core idea

> **Don't rebuild the entire schedule. Recover it with minimum unnecessary disruption.**

When an emergency procedure arrives, OR-ResQ:

1. Detects the schedule interruption.
2. Evaluates available ORs, surgeons and required resources.
3. Estimates the emergency procedure duration using the ML service.
4. Identifies affected procedures.
5. Recalculates the schedule.
6. Preserves unaffected procedures wherever possible.
7. Reallocates only the necessary procedures.
8. Presents the **before vs. after schedule** and the resulting changes.

---

# ⭐ What Makes OR-ResQ Different?

Traditional scheduling can produce a timetable.

OR-ResQ focuses on what happens **after the timetable breaks**.

### Static Scheduling

```text
Planned Schedule
       ↓
Emergency Arrives
       ↓
Schedule becomes invalid
       ↓
Manual rescheduling
```

### OR-ResQ

```text
Planned Schedule
       ↓
Emergency Arrives
       ↓
Detect affected schedule
       ↓
Predict procedure duration
       ↓
Recovery / Re-optimization
       ↓
Minimize unnecessary changes
       ↓
Recovered Schedule
```

The system is designed around **schedule recovery**, making the emergency-interruption scenario the central workflow.

---

# 🧠 System Architecture

```text
                    OR-ResQ
                       │
                       ▼
              ┌─────────────────┐
              │ React Frontend  │
              │ OR Control      │
              │ Center          │
              └────────┬────────┘
                       │
                       │ REST API
                       ▼
              ┌─────────────────┐
              │ Node.js Backend │
              │                 │
              │ Scheduling &    │
              │ Recovery Engine │
              └────────┬────────┘
                       │
              ┌────────┴─────────┐
              │                  │
              ▼                  ▼
       ┌──────────────┐   ┌──────────────┐
       │ PostgreSQL   │   │ Python ML    │
       │              │   │ FastAPI      │
       │ OR/Surgery   │   │ Service      │
       │ Data         │   │              │
       └──────────────┘   └──────┬───────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │ Random Forest  │
                         │ Duration       │
                         │ Prediction     │
                         └────────────────┘
```

### Important architectural decision

The React frontend **does not directly communicate with the ML service**.

```text
React
  ↓
Node.js Backend
  ↓
FastAPI ML Service
```

This keeps the ML component isolated and allows the scheduling engine to control how predictions are used.

---

# 🤖 ML Duration Prediction

OR-ResQ uses a machine-learning service to estimate procedure duration.

### Input

```json
{
  "procedure_type": "Knee Replacement",
  "surgeon_experience": 8,
  "patient_complexity": 3,
  "historical_average": 120
}
```

### Output

```json
{
  "predicted_duration": 131
}
```

The prediction is returned in **minutes** and can then be used by the scheduling/recovery engine.

### ML Pipeline

```text
Surgery Parameters
       ↓
Feature Processing
       ↓
Random Forest Regressor
       ↓
Predicted Duration
       ↓
Scheduling / Recovery Engine
```

### Current Prototype Model

| Metric           |                  Result |
| ---------------- | ----------------------: |
| Training records | 1,200 synthetic records |
| Algorithm        | Random Forest Regressor |
| Test records     |                     240 |
| MAE              |            8.26 minutes |
| RMSE             |           12.91 minutes |
| R²               |                  0.9740 |

> **Note:** The current dataset is synthetic prototype data created for the hackathon. The model is intended for software demonstration and scheduling research, not clinical decision-making.

---

# 🔄 Emergency Recovery Workflow

The central OR-ResQ workflow is:

### 1. Existing Schedule

```text
OR 1
08:00 ───── Surgery A ───── 10:00
10:00 ───── Surgery B ───── 12:00
12:30 ───── Surgery C ───── 14:30

OR 2
08:00 ───── Surgery D ───── 10:00
10:30 ───── Surgery E ───── 12:30
```

### 2. Emergency Arrives

```text
🚨 EMERGENCY PROCEDURE

Priority: CRITICAL
Required OR: OR 1
Estimated Duration: ML Prediction
```

### 3. Recovery Engine

The backend evaluates the current schedule and determines which procedures are affected.

### 4. Recovered Schedule

```text
OR 1
08:00 ───── Surgery A ───── 10:00
10:00 ───── EMERGENCY ───── 11:45
11:45 ───── Surgery B ───── 13:45
14:00 ───── Surgery C ───── 16:00
```

The frontend highlights:

* Procedures that remained unchanged
* Procedures that were delayed
* Procedures that were moved
* OR reassignment
* Updated time slots
* Schedule disruption

---

# 🛡️ Resilient ML Integration

The ML service is designed so that an ML failure does **not** bring down the scheduling engine.

If the ML service is unavailable:

```text
ML Prediction
     │
     ├── Available → Use predicted duration
     │
     └── Unavailable
             ↓
      Historical Average
             ↓
      Continue Scheduling
```

The backend can fall back to the procedure's `historical_average`.

This keeps the core scheduling workflow operational even when the ML service is unavailable.

---

# 🔌 ML API

### Health Check

```http
GET /
```

### Detailed Health Check

```http
GET /health
```

### Duration Prediction

```http
POST /predict-duration
```

Example request:

```json
{
  "procedure_type": "Knee Replacement",
  "surgeon_experience": 8,
  "patient_complexity": 3,
  "historical_average": 120
}
```

Example response:

```json
{
  "predicted_duration": 131
}
```

---

# 🧩 Technology Stack

### Frontend

* React
* JavaScript
* CSS

### Backend

* Node.js
* Express

### Machine Learning

* Python
* FastAPI
* Pandas
* NumPy
* Scikit-learn
* Joblib

### Database

* PostgreSQL

### Development & Collaboration

* Git
* GitHub
* VS Code
* IntelliJ IDEA

---

# 📁 Repository Structure

```text
OR-ResQ/
│
├── backend/
│   └── Node.js scheduling & recovery engine
│
├── ml-service/
│   ├── app.py
│   ├── generate_dataset.py
│   ├── train_model.py
│   ├── predict.py
│   ├── requirements.txt
│   ├── data/
│   │   └── surgery_duration.csv
│   ├── model/
│   │   ├── duration_model.joblib
│   │   └── metrics.json
│   └── INTEGRATION_CONTRACT.md
│
├── frontend/
│   └── React OR Control Center
│
└── README.md
```

---

# 🌿 Development Workflow

The project is developed using separate branches for each major component:

```text
main
│
├── shobika-ml
├── backend
├── frontend
└── integration/ml/backend
```

This allows individual components to be developed and tested independently before being merged into the stable `main` branch.

---

# ▶️ Running the ML Service

Navigate to:

```bash
cd ml-service
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Generate the prototype dataset:

```bash
python generate_dataset.py
```

Train the model:

```bash
python train_model.py
```

Start the FastAPI service:

```bash
python -m uvicorn app:app --reload --port 8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

# 🧪 Current Implementation Status

| Component                   | Status            |
| --------------------------- | ----------------- |
| Problem analysis            | ✅ Completed       |
| Scheduling/recovery backend | ✅ Implemented     |
| ML dataset generation       | ✅ Completed       |
| Duration prediction model   | ✅ Trained         |
| FastAPI ML service          | ✅ Implemented     |
| ML API testing              | ✅ Completed       |
| Backend ↔ ML integration    | ✅ Implemented     |
| React frontend              | 🔄 In development |
| Full-system integration     | 🔄 In progress    |
| Final end-to-end testing    | ⏳ Upcoming        |

---

# 🎯 Hackathon Demo Flow

The intended demonstration follows one simple story:

```text
1. Show the current OR schedule
          ↓
2. Introduce an emergency surgery
          ↓
3. System evaluates the interruption
          ↓
4. ML estimates procedure duration
          ↓
5. Recovery engine recalculates the schedule
          ↓
6. Show BEFORE vs AFTER
          ↓
7. Highlight affected and preserved procedures
          ↓
8. Display the recovered OR schedule
```

This demonstrates the core capability of OR-ResQ:

> **A schedule is not just created — it is continuously recoverable when reality changes.**

---

# ⚠️ Scope & Safety

OR-ResQ is an academic hackathon prototype.

The system:

* Uses synthetic data for ML experimentation.
* Does not diagnose patients.
* Does not recommend medical treatment.
* Does not replace clinical judgment.
* Does not make autonomous clinical decisions.

Its purpose is to demonstrate **software-based operating-room scheduling, optimization and emergency schedule recovery**.

---

# 👥 Team

**OR-ResQ Team**

* **Backend & Scheduling Engine** — Samyuktha
* **ML & Prediction Service** — Shobika
* **Frontend & UI** — Kutty

---

## OR-ResQ

### **When an emergency changes the plan, OR-ResQ changes the plan without losing the whole schedule.**

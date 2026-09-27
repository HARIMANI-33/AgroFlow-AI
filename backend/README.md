# AGROFLOW AI - Backend Service

FastAPI-powered backend foundation for AGROFLOW AI agricultural supply-chain platform.

---

## 1. Prerequisites

* Python 3.11+ (or Python 3.9+)
* PostgreSQL 14+ installed and running

---

## 2. Setup & Virtual Environment

### Step 1: Create a virtual environment
Open a terminal in the `backend/` directory:

```powershell
# From the backend directory
python -m venv .venv
```

### Step 2: Activate the virtual environment on Windows
In PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

*(If PowerShell script execution is restricted, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` or activate using `.venv\Scripts\activate.bat` in CMD).*

### Step 3: Install dependencies

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Environment Configuration

Copy the example environment file:

```powershell
copy .env.example .env
```

Configure local credentials in `.env`:

```ini
# Application Settings
ENVIRONMENT=development
DEBUG=True
API_V1_PREFIX=/api/v1
PROJECT_NAME="AGROFLOW AI Backend"

# CORS (Frontend origins)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/agroflow_db

# Security
JWT_SECRET_KEY=your_secure_random_secret_key_here_min_32_chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## 4. PostgreSQL Configuration

1. Start your local PostgreSQL server or ensure the service is running:
   ```powershell
   Get-Service -Name *postgres*
   ```
2. Create the project database via `psql` or pgAdmin:
   ```sql
   CREATE DATABASE agroflow_db;
   ```
3. Update `DATABASE_URL` in `.env` to match your local database username and password.

---

## 5. Database Migrations (Alembic)

Alembic is configured to detect models registered under `app.models`.

* Run pending migrations:
  ```powershell
  alembic upgrade head
  ```
* Generate a new migration after adding/updating models:
  ```powershell
  alembic revision --autogenerate -m "Add model description"
  ```
* Rollback last migration:
  ```powershell
  alembic downgrade -1
  ```

---

## 6. Running the FastAPI Application

Start the development server with live reload:

```powershell
uvicorn app.main:app --reload --port 8000
```

* API Docs (Swagger UI): [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
* Alternative Docs (ReDoc): [http://127.0.0.1:8000/api/v1/redoc](http://127.0.0.1:8000/api/v1/redoc)

---

## 7. Testing Health Endpoint

Verify the backend service is responding:

### Using curl:
```powershell
curl http://127.0.0.1:8000/api/v1/health
```

### Expected Response:
```json
{
  "status": "ok",
  "message": "AGROFLOW backend is running"
}
```

---

## 8. Backend Directory Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI entrypoint & health endpoint
│   ├── core/              # Config (pydantic-settings) & Security (bcrypt, JWT)
│   ├── database/          # SQLAlchemy engine, session maker, get_db dependency
│   ├── models/            # SQLAlchemy database models
│   ├── schemas/           # Pydantic request/response schemas
│   ├── routers/           # API route handlers
│   └── services/          # Business logic services
├── alembic/               # Database migration scripts & environment
├── uploads/               # Secure directory for crop photos (ignored in Git)
├── requirements.txt       # Pinned dependencies
├── .env.example           # Environment template
└── README.md              # Backend documentation
```

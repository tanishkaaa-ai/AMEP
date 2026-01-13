# System Architecture

This document provides a high-level overview of the AMEP system architecture
and explains the responsibility of each major component.

The architecture is designed to be modular, extensible, and easy to understand,
especially for new contributors.

---

## High-Level View

AMEP follows a layered architecture with clear separation of concerns:

Frontend  →  Backend  →  Database  
                ↓  
        Analytics / Core Logic

Each layer has a focused responsibility and communicates through well-defined
interfaces.

---

## Frontend

**Location:** `frontend/`

The frontend is responsible for:
- Student and teacher user interfaces
- Dashboards for mastery, engagement, and projects
- Input mechanisms such as assessments, polling, and peer reviews

This layer focuses purely on presentation and user interaction and communicates
with the backend via APIs.

---

## Backend

**Location:** `backend/`

The backend contains the core application logic, including:
- Concept mastery tracking
- Engagement analysis
- Project and team management
- API endpoints for frontend consumption

Educational logic and analytics live in this layer. Initial implementations are
kept simple and interpretable, with the ability to evolve into more advanced
models over time.

---

## Database

**Location:** `database/`

The database layer manages persistent data such as:
- User and student profiles
- Concept mastery scores
- Engagement records
- Project artifacts and peer evaluations

Schemas are designed to support both individual-level tracking and aggregated
class-level insights.

---

## Documentation

**Location:** `docs/`

The documentation layer exists to explain:
- Project vision and goals
- System architecture and design decisions
- Roadmap and future plans
- Contribution guidelines

This ensures that new contributors can understand the system without requiring
deep prior context.

---

## Architectural Principles

- **Single source of truth** – Data should be entered once and reused where needed  
- **Incremental complexity** – Start simple, evolve responsibly  
- **Education-driven design** – Pedagogical needs guide technical decisions  
- **Contributor-friendly structure** – Clear boundaries and readable code  

---

## Future Expansion

The architecture is designed to support future additions such as:
- Adaptive learning and mastery models
- Real-time engagement analytics
- Deeper project-based learning workflows
- Scalable deployments across institutions

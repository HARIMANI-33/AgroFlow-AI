# AGROFLOW AI

A smart agricultural supply-chain platform designed to reduce unnecessary intermediaries by connecting farmers and buyers directly.

## Problem Statement

> **"Multiple intermediaries reduce farmers earnings and increase consumer prices."**  
> — Smart India Hackathon

AGROFLOW AI bridges this gap through a direct, transparent, and intelligent marketplace matching agricultural produce directly from source to demand.

---

## Planned Core Ideas

* **Direct Farmer-Buyer Connection**: Seamless, transparent trading channels bypassing excessive middlemen.
* **Today's Market Price**: Real-time mandi/market pricing insights to empower informed negotiations.
* **Buyer-Demand-First Matching**: Intelligent order pairing driven primarily by verified buyer purchase orders.
* **Bulk Order Aggregation**: Pooling demand and supply to achieve wholesale efficiency for smallholder farmers.
* **Future Harvest & Future Demand Matching**: Contract and advance harvest planning to guarantee market off-take before harvest.
* **Crop Photo Uploads**: Visual verification and quality assessment through farm photo captures.
* **Smart Crop Recommendations**: Data-driven advisory on crop selection, planting schedules, and seasonal demand.
* **Simple Farmer-Friendly Interface**: Frictionless, intuitive experience tailored for grassroots accessibility.
* **Tamil and English Language Support**: Native bilingual support from first launch.

*(Note: All capabilities above represent planned architecture and features for upcoming milestones.)*

---

## Core Product & Language Flow Requirements

* **Initial Landing Screen**:
  * User Persona Selection: **Farmer** or **Buyer**
  * Top-Corner Language Toggle: **தமிழ்** / **English**
* **Language Precedence**: Users select their language before entering Login/Register. The chosen language persists throughout the entire application session.
* **Architecture**: A single, unified multilingual web application (not separate applications).

---

## Project Structure

```text
AgroFlow-AI/
├── backend/        # Backend services (FastAPI - Planned)
├── frontend/       # Web client interface (Planned)
├── docs/           # Documentation and specifications
├── .env.example    # Template environment configurations
├── .gitignore      # Git exclusion rules
└── README.md       # Project overview
```

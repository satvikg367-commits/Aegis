# Team Vision Codex - AEGIS (Template-Matched Content)

## Slide 1
Problem Statement: Retired Defence Officers Portal
Team Name: Vision Codex
Team Leader Name: Satvik Gupta
Members name: Sachin Maurya, Prashant Kumar, Saurabh Singh

## Slide 2
Problem Statement
Proposed Solution

Many retired defence officers still depend on disconnected systems for pension, healthcare, and re-employment support. This causes delays, confusion, and low visibility of service status.

Build a secure centralized web portal (AEGIS) where users can manage pension details, book healthcare appointments, explore job opportunities, and connect through a community forum in one place.

## Slide 3
Methodology
          &
Implementation

We followed a module-first approach: identified core user needs, designed a React + Node architecture, implemented each module (auth, pension, healthcare, career, community), tested with demo workflows, and deployed live on Render.

## Slide 4
Tech Used&Flowchart

Frontend: React (Vite), React Router, CSS, JavaScript
Backend: Node.js + Express
Security: JWT, bcrypt, optional 2FA
Data Layer: JSON file-based DB (prototype)
Hosting: Render (separate frontend and backend services)

Flow:
User -> Frontend (React) -> API Layer (Express) -> Auth/Business Logic -> Data Store -> Response

## Slide 5
Showstoppers & Business Model
Showstoppers                          Business Model

- Integration with official defence and pension systems may require approvals and phased rollout.
- Data privacy and compliance need enterprise-grade controls in production.

- Government/department partnerships for service integration.
- Premium institutional services (analytics, admin dashboards, enterprise support).
- Recruitment partnerships for veteran-focused job postings.

USP:
We provide one secure, practical, and accessible command-center for retired defence officers, combining pension, healthcare, career, and community in one platform.

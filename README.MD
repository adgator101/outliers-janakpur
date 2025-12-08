# Outliers Janakpur - Safety Reporting Platform

## Core Idea
This project idea is to empower citizens to report Gender-Based Violence (GBV) incidents and unsafe areas in their community. By leveraging interactive mapping, the platform allows users to anonymously mark danger zones, draw specific areas on a map, and describe incidents.

The goal is to visualize high-risk "hotspots" to alert local authorities and NGOs, facilitating timely interventions (e.g., installing street lights, increasing patrols) and creating a safer environment for everyone.

## Key Features

### Interactive Map Interface
- **Mapbox GL Integration:** A minimalistic, Google Maps-inspired interface focusing on clarity and ease of use.
- **Drawing Tools:** Users can mark specific locations using points or draw polygons to define unsafe areas using Mapbox Draw.
- **Hotspot Visualization:** Aggregated data highlights high-alert zones based on report frequency.

### Incident Reporting
- **Anonymous Reporting:** Users can report GBV incidents or safety concerns (e.g., broken streetlights) without compromising their identity.
- **Detailed Descriptions:** Submission forms allow for categorization and description of incidents.
- **Multimedia Support:** (Planned) Capability to upload photos of unsafe conditions.

### Community & Action
- **Discussion Panels:** Clicking on a marked area opens a side panel (Google Maps style) displaying incident details and community discussions.
- **Status Updates:** Areas can be marked as "Safe" or "Verified" once authorities take action (e.g., "Street lights installed").

### Authorities & NGO Dashboard
- **Dedicated Portal:** A separate view for NGOs, local authorities, and admins.
- **Alert System:** Automatic notifications for high-alert zones with many valid reports.
- **Data Visualization:** Map and list views to track incidents and manage interventions.

## Technology Stack

### Frontend
- **Framework:** React
- **Mapping:** Mapbox GL JS, Mapbox Draw
- **Styling:** CSS / Custom Components

### Backend
- **Framework:** FastAPI (Python)
- **Data format:** GeoJSON for coordinate storage
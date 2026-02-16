Korean version: [한국어 문서](https://github.com/seyun4047/drone-platform-dashboard/blob/main/README.kr.md)

---

# MAIN-DRONE Dashboard

---
## Repository Overview

The Drone Platform Dashboard is the front-end of
<br> the Manufacturer-Independent Drone Platform.

This dashboard visually organizes real-time drone telemetry and event data,<br> enabling rapid analysis and supporting fast,<br>effective disaster response and search-and-rescue operations.

---

## Core Functions

- **Live Node Discovery**: Automatically requests and tracks all "alive" drones currently connected to the central server.

- **Real-time Data Stream**: Collects and visualizes high-frequency telemetry (Speed, Power, GPS) and event data.

- **Event Intelligence**: Instantly captures and displays critical alerts like "Human Detected" with associated visual evidence.

---
## Preview
|LOGIN SESSION|DASHBAORD|
|:---:|:---:|
|<img width="1990" height="1046" alt="스크린샷 2026-02-16 03 52 16 1" src="https://github.com/user-attachments/assets/6fd2b85d-a507-49bd-b6b8-680ba3c5c36a" /> |<img width="1867" height="1046" alt="스크린샷 2026-02-16 03 45 13" src="https://github.com/user-attachments/assets/31c3a94b-923e-4080-812d-4b4ca28fdfab" />
|Secure authentication and session control|Real-time drone monitoring interface|

---

## Usage

Get the command center up and running in seconds:

```bash
# Install dependencies
npm install

# Start the dashboard in development mode
npm run dev
```

---


---

# PROJECT OVERVIEW
# Manufacturer-Independent Drone Platform

---
It is a **Manufacturer-Independent Drone Monitoring Platform.**

It is designed to manage various drones within a single environment,
enabling both **high-end professional drones and commercially available hobby camera drones**
to be used for lifesaving and disaster response.

---

## Introduction
- Click & Watch the Introduction Video
[![MAIN-DRONE](https://img.youtube.com/vi/7IdtRp_fe1U/maxresdefault.jpg)](https://youtu.be/7IdtRp_fe1U)

---

## Project Structure

This platform consists of multiple independent repositories:

| Component | Description                                       | Repository                                                              |
|---------|---------------------------------------------------|-------------------------------------------------------------------------|
| Server | Core drone platform server (API, Auth, Telemetry) | [GitHub](https://github.com/seyun4047/drone-platform-server)            |
| Monitoring Server | Real-time Drone health check monitoring service   | [GitHub](https://github.com/seyun4047/drone-platform-monitoring-server) |
| Drone Data Tester | Test client for drone telemetry & data simulation | [GitHub](https://github.com/seyun4047/drone-platform-trans-tester)       |
| Drone Client | Drone Data Collection, Transmission & Analysis | [GitHub](https://github.com/seyun4047/drone-platform-client)            |
| Dashboard | Drone platform's front-end | [GitHub](https://github.com/seyun4047/drone-platform-dashboard)            |
| Docs | Platform Documents, API's | [GitHub](https://github.com/seyun4047/drone-platform-docs)|

---

## Background

Although custom drones, commercial drones, and consumer drones share similar basic control mechanisms,
their operational methods and **command-and-control structures** in real-world environments vary significantly.

In practice, drones are often utilized as tools that depend heavily on:
- Specific equipment
- Highly trained personnel

Recently, many institutions and companies have attempted to build drone systems integrated with AI technologies.  
However, these systems have clear limitations. They typically rely on tuning specific drone models or operating a single type of custom-built drone, which results in strong dependency on specialized personnel and proprietary technologies.

Such dependency is particularly critical in **life-saving and disaster response operations**.

---
## Project Goal
- A manufacturer-independent drone monitoring platform that supports lifesaving and disaster response operations.

---
## Objectives

- A drone monitoring and management system deployable regardless of drone model or manufacturer
- A system that can be immediately deployed in the field without complex control procedures
- A system that does not rely on the performance capabilities of specific drone hardware
- A system that allows non-professional drone hobbyists to contribute effectively in emergency situations

---

## Expected Impact

In life-saving and disaster response scenarios, before professional equipment or rescue teams arrive on site,  
any available drone—if operable by anyone—can be immediately deployed to:
- Assess victims
- Identify hazards
- Estimate damage

By securing this critical **golden time**, the system enables faster decision-making and more effective deployment of advanced rescue resources, ultimately leading to more sophisticated and impactful drone-assisted emergency response systems.

---

## System Architecture

### Overall System Architecture
<img width="900" alt="AWS Upload Presigned URL-2026-02-13-170224" src="https://github.com/user-attachments/assets/dcf9a853-1261-4a26-866a-c3518ad586f2" />

---

## Core System Flows

|                                                                           Auth Logic                                                                            |                                          Control Data From Drone                                          |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------:|
|  <img width="450" alt="Redis Token Connection Flow-2026-02-01-182619" src="https://github.com/user-attachments/assets/cf0e6a9e-eeae-4525-aaf1-198c98e61c90" />  | <img width="450" alt="Redis Token Connection Flow-2026-02-01-182708" src="https://github.com/user-attachments/assets/a344e0c5-b12a-45ab-951c-0cefcc87bf2b" />
 |
|                                                   **Redis-based authentication and connection control flow.**                                                   |                    **Processing of control and telemetry data after authentication.**                     |

|                                             Token Validation                                              |                                             Monitoring Server                                             |
|:---------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------:|
| <img src="https://github.com/user-attachments/assets/456dc993-64a0-4ac8-9138-0f5446aaad07" width="450"/>  |<img width="450" alt="Untitled diagram-2026-02-11-173920" src="https://github.com/user-attachments/assets/6eea1ba2-663d-4bf1-be1d-c729e3bda2f7" />|
|                          **Validation of Redis tokens for incoming drone data.**                          |                              **Periodic drone connection state monitoring.**                             |

| Back-End <-> Front-End |
|:---:|
| <img width="700" alt="AWS Upload Presigned URL-2026-02-13-144904" src="https://github.com/user-attachments/assets/97c1dbf0-3e24-4b4d-8669-65f076a0ffe5" /> |
| **Communication between Back-End Server and Front-End Dashboard** |

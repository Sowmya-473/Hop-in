# 🚗 CampusPool — Smart Campus Carpooling Platform

CampusPool is a MERN-stack web application that enables students to **offer rides, find rides, and travel together within a campus environment**.  
The platform aims to reduce travel costs, traffic congestion, and carbon emissions while improving transportation convenience for students.

---

# 📌 Overview

CampusPool is designed specifically for university campuses where many students travel to similar locations at similar times.

Students who have vehicles can **offer rides**, and other students can **search and book available rides** heading in the same direction.

The system provides a simple and efficient way to manage ride sharing within a trusted campus community.

---

# ✨ Key Features

## 🚘 Offer Ride
Drivers can create a ride listing with the following information:

• Pickup location  
• Destination  
• Departure time  
• Available seats  

These rides become visible to other users searching for similar routes.

---

## 🔍 Find Ride
Passengers can search for rides based on:

• Pickup location  
• Destination  
• Departure time  

The platform displays available matching rides instantly.

---

## 📅 Ride Booking
Passengers can:

• Book available seats  
• View ride details  
• Manage their bookings  

---

## ❌ Cancel Ride
Drivers can cancel rides they offered.

Passengers can also cancel their bookings if needed.

---

## 📊 User Dashboard
The dashboard allows users to manage their ride activities.

Users can:

• View offered rides  
• View booked rides  
• Track ride history  
• Cancel rides  

---

# 🏗️ Tech Stack

## Frontend
React.js  
TypeScript  
TailwindCSS  
Axios  

## Backend
Node.js  
Express.js  

## Database
MongoDB  

## Development Tools
VS Code  
Git & GitHub  
Postman  

---

# 🧠 System Architecture

User (Browser)

↓

React Frontend

↓

Node.js + Express Backend

↓

MongoDB Database

The frontend communicates with the backend using REST APIs, and all ride data is stored in MongoDB collections.

---

# 📂 Project Structure

CampusPool

frontend  
 components  
 pages  
 tabs  
 services  

backend  
 routes  
 controllers  
 models  
 config  

package.json  
README.md  

---

# ⚙️ Installation

## 1. Clone the Repository

git clone https://github.com/yourusername/CampusPool.git

---

## 2. Install Dependencies

Backend

cd backend  
npm install  

Frontend

cd frontend  
npm install  

---

## 3. Setup Environment Variables

Create a `.env` file inside the backend folder.

PORT=5004  
MONGO_URI=your_mongodb_connection_string  

---

## 4. Run Backend Server

npm run dev

---

## 5. Run Frontend

npm start

---

# 📡 API Endpoints

POST /api/rides  
Create a new ride

GET /api/rides  
Fetch all available rides

DELETE /api/rides/:id  
Cancel an existing ride

---

# 📷 Screenshots

(Add screenshots here)

Examples:

Dashboard  
Offer Ride Page  
Find Ride Page  
Ride Booking Page  

---

# 🚀 Future Improvements

• Real-time ride tracking  
• Payment integration  
• Ride rating system  
• Smart ride matching algorithm  
• Push notifications  

---

# 🌱 Impact

CampusPool helps:

• Reduce campus traffic congestion  
• Promote sustainable transportation  
• Save fuel and travel costs  
• Improve mobility within the campus community  

---

# 👨‍💻 Author

Cavin Chandran  
Integrated M.Tech CSE (Business Analytics)  
VIT Chennai

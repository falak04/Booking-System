# Booking System (Full Stack)

This project is a full-stack booking system, featuring a React + Vite frontend and a Node.js + Express backend. The monorepo structure allows for easy development and deployment of both client and server components.

---

## Monorepo Structure

```
booking-system/
├── backend/   # Node.js + Express API
└── frontend/  # React + Vite client
```

---

## Backend (`/backend`)

A RESTful API built with Node.js and Express, responsible for handling bookings, users, and related business logic.

### Features
- Express.js server
- Modular route handling
- MongoDB (or your DB) integration (update as needed)
- Middleware for authentication, validation, etc.

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/)
- MongoDB or your chosen database (update as needed)

### Setup & Running

```bash
cd backend
npm install
npm start
```

The backend server will start on the port specified in your configuration (commonly `http://localhost:5000`).

### Folder Structure

```
backend/
├── models/        # Mongoose models or DB schemas
├── routes/        # Express route handlers
├── middleware/    # Custom middleware
├── seed/          # Seed scripts for DB
├── utils/         # Utility functions
├── index.js       # Entry point
├── package.json   # Backend dependencies
```

---

## Frontend (`/frontend`)

A minimal React application bootstrapped with [Vite](https://vitejs.dev/), providing a fast development environment with Hot Module Replacement (HMR) and ESLint integration.

### Features
- ⚡️ Fast development with Vite
- ♻️ Hot Module Replacement (HMR)
- 🛠️ ESLint for code quality
- 🔌 Official Vite React plugins

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Setup & Running

```bash
cd frontend
npm install
npm run dev
# or
yarn install
yarn dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

### Plugins Used
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) — uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) — uses [SWC](https://swc.rs/) for Fast Refresh

### Folder Structure
```
frontend/
├── public/
├── src/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

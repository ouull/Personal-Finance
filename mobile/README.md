# Personal Finance Mobile App

This is the React Native + Expo mobile application for the Personal Finance system. It connects directly to the unified Next.js API backend.

## Prerequisites
- Node.js
- Expo CLI (`npm install -g expo-cli`)
- Running backend (`npm run dev` in the project root)

## Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Copy `.env.example` to `.env.local` and set your variables.

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```
*Note for Android Emulator*: Use `http://10.0.2.2:3000` instead of `localhost`.
*Note for Physical Device*: Use your machine's local IP address (e.g. `http://192.168.1.5:3000`).

## Development

Start the Expo development server:
```bash
npm start
```
or
```bash
npx expo start
```

Press `i` to open iOS simulator.
Press `a` to open Android emulator.

## Architecture & Authentication

- **Framework**: Expo SDK (React Native), Expo Router
- **State Management**: Zustand
- **Server State**: TanStack Query
- **Styling**: NativeWind (Tailwind CSS)
- **Forms**: React Hook Form + Zod
- **API Client**: Axios

**Authentication Flow**:
- Token storage uses `expo-secure-store` to safely store `accessToken` and `refreshToken`.
- The API client uses an Axios interceptor that automatically attaches the Bearer token.
- On a 401 response, the interceptor uses a concurrency-safe `async-mutex` lock to pause incoming requests and attempt a single refresh call to `/api/v1/auth/refresh`. If successful, the failed requests retry seamlessly. If failed, it logs the user out and redirects to Login.

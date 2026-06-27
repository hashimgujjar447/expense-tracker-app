# Expense Tracker App 💸

Welcome to my **Expense Tracker App**! This is my very first **React Native** application, built using **Expo** as part of my learning journey and tutorial practice. 

The app is designed to help users manage their finances by tracking income, expenses, and multiple wallets in real-time.

---

## 🚀 Key Features

* **User Authentication:** Secure email and password registration & login powered by **Firebase Auth**.
* **Wallet Management:** Create and customize multiple wallets (e.g., Cash, Card, Salary) to keep balances separated. It automatically aggregates total income and total expenses.
* **Transaction Tracking:** Add, modify, or delete income and expense transactions. Supports adding descriptions, categories, and uploading receipts/images.
* **Dynamic Statistics (Weekly, Monthly, Yearly):** Visualizes financial data using beautiful dual-bar charts from `react-native-gifted-charts` for weekly, monthly, and yearly views. Shows all transactions related to the selected time filter.
* **Instant Search Modal:** A dedicated search interface with a focus-on-open search bar. It performs instantaneous client-side filtering through all transactions by category, description, or type.
* **Modern UI/UX:** Styled using custom dark-themed aesthetics, glassmorphism-inspired components, premium typography, and smooth micro-animations powered by `react-native-reanimated`.

---

## 🛠️ Technology Stack

* **Frontend Framework:** [React Native](https://reactnative.dev/) with [Expo (v54)](https://expo.dev/)
* **Routing:** File-based routing via [Expo Router](https://docs.expo.dev/router/introduction/)
* **Database & Authentication:** [Firebase Firestore](https://firebase.google.com/docs/firestore) & [Firebase Auth](https://firebase.google.com/docs/auth)
* **Optimization & Performance:** [@shopify/flash-list](https://shopify.github.io/flash-list/) for highly-performant transaction list scrolling
* **Charts & Analytics:** [React Native Gifted Charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts)
* **Icons:** [Phosphor Icons (phosphor-react-native)](https://phosphoricons.com/)
* **Image Hosting:** [Cloudinary](https://cloudinary.com/) (used for uploading transaction attachments)

---

## ⚙️ Getting Started

Follow these steps to run the project locally:

### 1. Prerequisites
Ensure you have Node.js installed. You'll also need the Expo Go app on your phone (iOS/Android) or an emulator setup.

### 2. Clone and Install Dependencies
```bash
# Install package dependencies
npm install
```

### 3. Setup Firebase
The project relies on Firebase. You can find the configuration file at `config/firebase.ts`. Add your Firebase Web App credentials there:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 4. Run the Dev Server
```bash
# Start the Expo development server
npx expo start
```
* Scan the QR code with your Expo Go app, or press `a` for Android Emulator / `i` for iOS Simulator to run the project!

---

## 🎓 My Learning & Reflections
As my first React Native and Expo app, building this has helped me understand:
1. **State Management & Context API:** Using React Context to handle global user authentication state.
2. **File-based Routing:** Navigating between tab bars, stack screens, and modal presentations seamlessly.
3. **Database Integration:** Performing CRUD operations on Firestore collections and setting up real-time sync listeners (`onSnapshot`).
4. **Layout Constraints & Keyboard Resizing:** Handling native layout changes like keyboard avoidance and handling scrollable content behavior in modals.

import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import DeliveryDashboardPage from "./pages/DeliveryDashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrdersPage from "./pages/OrdersPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import RestaurantPage from "./pages/RestaurantPage";
import SignupPage from "./pages/SignupPage";

export default function App() {
  const { bootstrapAuth } = useAuth();

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Dedicated restaurant detail + menu page */}
      <Route
        path="/restaurant/:restaurantId"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <RestaurantPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery"
        element={
          <ProtectedRoute allowedRoles={["delivery"]}>
            <DeliveryDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order/:id/track"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <OrderTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["customer", "owner", "delivery"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/app" element={<Navigate to="/customer" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
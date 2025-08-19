import { useState } from "react";
import {
  BrowserRouter as Router,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { SignInPage } from "@toolpad/core/SignInPage";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import type { AuthProvider } from "@toolpad/core";
import { AppRoutes } from "./routes";
import { NAVIGATION } from "./navigation";
import "./App.css";

import { justRideClient } from "./client/justride";
import type { AppSession } from "./session";

function Dashboard({ session }: { session: AppSession }) {
  const location = useLocation();
  const navigate = useNavigate();

  const router = {
    pathname: location.pathname,
    searchParams: new URLSearchParams(location.search),
    navigate: (url: string | URL) => {
      const path = typeof url === "string" ? url : url.pathname;
      navigate(path);
    },
  };

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      branding={{
        title: "MyRide Explorer",
      }}
      session={session}
    >
      <DashboardLayout>
        <AppRoutes session={session} />
      </DashboardLayout>
    </AppProvider>
  );
}

function App() {
  const [session, setSession] = useState<AppSession | null>(null);

  const signIn = async (_provider: AuthProvider, formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const user = await justRideClient.login(email, password);
    const newSession: AppSession = { user };
    setSession(newSession);
    return { type: "CredentialsSignin" as const };
  };

  const signOut = () => {
    setSession(null);
  };

  return (
    <Router>
      {session ? (
        <Dashboard session={{ ...session, signOut } as AppSession} />
      ) : (
        <SignInPage
          signIn={signIn}
          providers={[
            {
              id: "credentials",
              name: "Email and Password",
            },
          ]}
        />
      )}
    </Router>
  );
}

export default App;

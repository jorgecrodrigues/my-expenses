import { lazy, Suspense } from "react";
import AppGrid from "@/shared/components/AppGrid";
import Header from "@/shared/components/Header";
import Sidebar from "@/shared/components/Sidebar";
import { Route, Switch } from "wouter";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Box, Center } from "@chakra-ui/react";
import Logo from "@/shared/components/Logo";

const HomePage = lazy(() => import("@/features/Home/pages/HomePage"));
const DashboardPage = lazy(() => import("@/features/Dashboard/pages/DashboardPage"));
const ExpensePage = lazy(() => import("@/features/Expense/pages/ExpensePage"));
const BankAccountPage = lazy(() => import("@/features/BankAccount/pages/BankAccountPage"));
const AboutPage = lazy(() => import("@/features/About/pages/AboutPage"));
const SignIn = lazy(() => import("@/features/Auth/pages/SignIn"));

function RouteFallback() {
  return (
    <Center height="100vh">
      <Logo loading={true} />
    </Center>
  );
}

export default function App() {
  return (
    <>
      <AuthLoading>
        <Center height="100vh">
          <Logo loading={true} />
        </Center>
      </AuthLoading>
      <Authenticated>
        <AppGrid
          header={<Header />}
          sidebar={<Sidebar />}
          children={
            <Box px={5} py="30px" minH="calc(100vh - 60px)" bg="bg.muted">
              <Suspense fallback={<RouteFallback />}>
                <Switch>
                  <Route path="/" component={HomePage} />
                  <Route path="/dashboard" component={DashboardPage} />
                  <Route
                    path="/dashboard/month/:month/year/:year"
                    component={DashboardPage}
                  />
                  <Route
                    path="/dashboard/month/:month/year/:year/category/:category"
                    component={DashboardPage}
                  />
                  <Route path="/expenses" component={ExpensePage} />
                  <Route path="/bank-accounts" component={BankAccountPage} />
                  <Route path="/about" component={AboutPage} />
                  <Route>
                    <h2>404 - Page Not Found</h2>
                  </Route>
                </Switch>
              </Suspense>
            </Box>
          }
        />
      </Authenticated>
      <Unauthenticated>
        <Suspense fallback={<RouteFallback />}>
          <SignIn />
        </Suspense>
      </Unauthenticated>
    </>
  );
}

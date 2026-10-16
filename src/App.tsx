import { lazy, Suspense } from "react";
import AppGrid from "@/shared/components/AppGrid";
import Header from "@/shared/components/Header";
import Sidebar from "@/shared/components/Sidebar";
import MobileNav from "@/shared/components/MobileNav";
import { Route, Switch } from "wouter";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Box, Center } from "@chakra-ui/react";
import Logo from "@/shared/components/Logo";

const HomePage = lazy(() => import("@/features/Home/pages/HomePage"));
const DashboardPage = lazy(() => import("@/features/Dashboard/pages/DashboardPage"));
const ExpensePage = lazy(() => import("@/features/Expense/pages/ExpensePage"));
// const BankAccountPage = lazy(() => import("@/features/BankAccount/pages/BankAccountPage"));
const CreditCardPage = lazy(() => import("@/features/CreditCard/pages/CreditCardPage"));
const StatementReportPage = lazy(
  () => import("@/features/CreditCard/pages/StatementReportPage"),
);
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
          sidebar={
            <>
              <Box hideBelow="md" h="full">
                <Sidebar />
              </Box>
              <Box hideFrom="md">
                <MobileNav />
              </Box>
            </>
          }
          children={
            <Box
              px={{ base: 3, md: 5 }}
              py={{ base: 4, md: "30px" }}
              minH="full"
              bg="bg.muted"
            >
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
                  {/* <Route path="/bank-accounts" component={BankAccountPage} /> */}
                  <Route path="/credit-card" component={CreditCardPage} />
                  <Route
                    path="/credit-card/statements/:statementId"
                    component={StatementReportPage}
                  />
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

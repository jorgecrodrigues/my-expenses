import AppGrid from "@/shared/components/AppGrid";
import Header from "@/shared/components/Header";
import Sidebar from "@/shared/components/Sidebar";
import { Route, Switch } from "wouter";
import ExpensePage from "@/features/Expense/pages/ExpensePage";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import SingIn from "@/features/Auth/pages/SignIn";
import { Box, Center } from "@chakra-ui/react";
import Logo from "@/shared/components/Logo";
import DashboardPage from "@/features/Dashboard/pages/DashboardPage";
import AboutPage from "./features/About/pages/AboutPage";
import HomePage from "./features/Home/pages/HomePage";

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
            <Box px={5} py={4} bg="bg.muted">
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
                <Route path="/about" component={AboutPage} />
                <Route>
                  <h2>404 - Page Not Found</h2>
                </Route>
              </Switch>
            </Box>
          }
        />
      </Authenticated>
      <Unauthenticated>
        <SingIn />
      </Unauthenticated>
    </>
  );
}

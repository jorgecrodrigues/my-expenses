import React from "react";
import AppGrid from "./shared/components/AppGrid";
import Header from "./shared/components/Header";
import Sidebar from "./shared/components/Sidebar";
import { Route, Switch } from "wouter";
import ExpensePage from "./features/Expense/pages/ExpensePage";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import SingIn from "./features/Auth/pages/SignIn";
import { Center } from "@chakra-ui/react";
import Logo from "./shared/components/Logo";

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
            <React.Fragment>
              <Switch>
                <Route path="/">Home Page</Route>
                <Route path="/expenses" component={ExpensePage} />
                <Route path="/about">About Page</Route>
                <Route>
                  <h2 style={{ padding: 20, textAlign: "center" }}>
                    404 - Page Not Found
                  </h2>
                </Route>
              </Switch>
            </React.Fragment>
          }
        />
      </Authenticated>
      <Unauthenticated>
        <SingIn />
      </Unauthenticated>
    </>
  );
}

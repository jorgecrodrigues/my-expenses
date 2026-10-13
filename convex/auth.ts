import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // GitHub sends this as the `iss` callback parameter (RFC 9207), and
    // oauth4webapi rejects the callback unless it matches exactly.
    GitHub({ issuer: "https://github.com/login/oauth" }),
  ],
});

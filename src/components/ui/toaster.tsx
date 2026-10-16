"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

// eslint-disable-next-line react-refresh/only-export-components
export const toaster = createToaster({
  placement: "bottom",
  offsets: {
    top: "1rem",
    left: "1rem",
    right: "1rem",
    bottom: "var(--toaster-offset-bottom, 1rem)",
  },
  pauseOnPageIdle: true,
  duration: 2000,
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster
        toaster={toaster}
        insetInline={{ mdDown: "4" }}
        css={{
          "--toaster-offset-bottom": {
            base: "calc(5rem + env(safe-area-inset-bottom, 0px))",
            md: "1rem",
          },
        }}
      >
        {(toast) => (
          <Toast.Root width={{ md: "sm" }}>
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};

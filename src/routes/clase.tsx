import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/clase")({
  beforeLoad: () => {
    throw redirect({ to: "/unirse", replace: true });
  },
});

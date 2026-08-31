"use client";

import { useEffect } from "react";
import { ErrorScreen } from "./error-screen";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("PSS Hero route error", { digest: error.digest });
  }, [error]);
  return <ErrorScreen statusCode={500} retry={reset} />;
}

import { ErrorScreen } from "./error-screen";

export default function NotFound() {
  return <ErrorScreen statusCode={404} />;
}

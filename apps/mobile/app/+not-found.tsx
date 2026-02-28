import { useRouter } from "expo-router";
import { ErrorScreen } from "../components/ui/ErrorScreen";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <ErrorScreen
      emoji="🍽️"
      title="404 — Not on the menu"
      subtitle="This dish doesn't exist. Let's get you back to the kitchen."
      onGoHome={() => router.replace("/")}
    />
  );
}

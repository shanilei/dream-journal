import { Suspense } from "react";
import SignInScreen from "@/components/SignInScreen";

export default function SignInPage() {
  return (
    // SignInScreen reads the optional ?error=1 query param via
    // useSearchParams(), which requires a Suspense boundary in the App
    // Router — falling back to nothing rather than a spinner since this
    // resolves practically instantly (it's a client-side hook read, not
    // a data fetch).
    <Suspense fallback={null}>
      <SignInScreen />
    </Suspense>
  );
}

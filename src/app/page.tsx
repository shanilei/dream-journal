import { redirect } from "next/navigation";

// middleware.ts already redirects unonboarded visitors to /onboarding
// before this ever runs, so by the time we're here onboarding is
// guaranteed complete — this route is just a landing pad to /record.
export default function HomePage() {
  redirect("/record");
}

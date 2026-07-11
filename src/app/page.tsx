import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

export default async function HomePage() {
  const store = await cookies();
  const onboarded = store.get(ONBOARDING_COOKIE)?.value === "1";
  redirect(onboarded ? "/record" : "/onboarding");
}

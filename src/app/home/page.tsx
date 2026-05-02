import { HomeDashboard } from "@/components/home/HomeDashboard";
import { getOauthProviderFlags } from "@/lib/auth-provider-flags";

export default function HomePage() {
  return <HomeDashboard oauthProviders={getOauthProviderFlags()} />;
}

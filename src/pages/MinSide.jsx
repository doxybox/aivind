import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Bell, LogOut, Megaphone, User as UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardSidebar from "@/components/minside/DashboardSidebar";
import SubscriptionCard from "@/components/minside/cards/SubscriptionCard";
import ProfileCard from "@/components/minside/cards/ProfileCard";
import SavedArticlesCard from "@/components/minside/cards/SavedArticlesCard";
import NewsletterCard from "@/components/minside/cards/NewsletterCard";
import PaymentHistoryCard from "@/components/minside/cards/PaymentHistoryCard";
import SecurityCard from "@/components/minside/cards/SecurityCard";
import PrivacyCard from "@/components/minside/cards/PrivacyCard";
import TwoFactorCard from "@/components/minside/cards/TwoFactorCard";
import HelpCenter from "@/components/minside/HelpCenter";
import KundeportalOversikt from "@/components/minside/KundeportalOversikt";
import EavisCard from "@/components/minside/cards/EavisCard";
import TipsOssCard from "@/components/minside/cards/TipsOssCard";
import { getAccountOverview } from "@/lib/account-client";
import {
  formatAccountDate,
  getAccountPlanLabel,
  getAccountStatusLabel,
  getAvatarInitial,
  getDisplayName,
  isActivePaidSubscription,
} from "@/lib/account-display";

function buildAccountNotifications({ overview, loadFailed }) {
  if (loadFailed) {
    return [{ title: "Kunne ikke hente kontostatus akkurat nå.", meta: "Prøv igjen senere" }];
  }

  if (!overview) {
    return [{ title: "Henter kontostatus ...", meta: "Et øyeblikk" }];
  }

  const notifications = [];
  const createdDate = formatAccountDate(overview.profile?.created_date);
  const subscription = overview.subscription;

  if (isActivePaidSubscription(subscription)) {
    const renewsAt = formatAccountDate(subscription.current_period_end);
    notifications.push({
      title: "Abonnementet ditt er aktivt.",
      meta: renewsAt ? `Neste periode starter etter ${renewsAt}` : "Hentet fra abonnementet ditt",
    });
  } else {
    notifications.push({
      title: "Du bruker gratisversjonen.",
      meta: "Oppgrader fra abonnementssiden når du er klar",
    });
  }

  notifications.push({
    title: "Kontoen din er klar.",
    meta: createdDate ? `Opprettet ${createdDate}` : "Hentet fra profilen din",
  });

  return notifications;
}

export default function MinSide() {
  const { user: authUser, isLoadingAuth, logout } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("oversikt");
  const [accountOverview, setAccountOverview] = useState(null);
  const [accountOverviewError, setAccountOverviewError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const upgrade = params.get("upgrade");
    if (payment) setPaymentStatus(payment);
    if (upgrade === "true") setUpgradeOpen(true);
    if (payment || upgrade) {
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("upgrade");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
      window.location.href = "/login?callbackURL=/min-side";
    }
  }, [authUser, isLoadingAuth]);

  useEffect(() => {
    if (!authUser) return undefined;

    let ignore = false;

    (async () => {
      try {
        const overview = await getAccountOverview();
        if (!ignore) {
          setAccountOverview(overview);
          setAccountOverviewError(false);
        }
      } catch {
        if (!ignore) {
          setAccountOverview(null);
          setAccountOverviewError(true);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [authUser]);

  const handleSectionSelect = (id) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isOverview = activeSection === "oversikt";

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser) return null;

  const user = {
    ...authUser,
    full_name: authUser.name,
    display_name: authUser.name,
  };
  const displayName = getDisplayName(user, accountOverview?.profile);
  const avatarInitial = getAvatarInitial(user, accountOverview?.profile);
  const accountPlanLabel = getAccountPlanLabel({
    subscription: accountOverview?.subscription,
    premiumAccess: Boolean(accountOverview?.premiumAccess),
    loadFailed: accountOverviewError,
  });
  const topbarStatusLabel = getAccountStatusLabel({
    subscription: accountOverview?.subscription,
    premiumAccess: Boolean(accountOverview?.premiumAccess),
    loadFailed: accountOverviewError,
  });
  const notifications = buildAccountNotifications({
    overview: accountOverview,
    loadFailed: accountOverviewError,
  });

  return (
    <div className="dark min-h-screen flex relative font-sans text-white w-full overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 fixed"
        style={{ backgroundImage: 'url("/images/placeholders/account-background.svg")' }}
      />
      <div className="absolute inset-0 z-0 bg-black/80 backdrop-blur-[60px] fixed" />

      <DashboardSidebar user={user} activeSection={activeSection} onSelect={handleSectionSelect} onLogout={() => logout(true)} />

      <main className="flex-1 min-w-0 relative z-10 lg:pl-[280px] flex flex-col min-h-screen">
        <div className="hidden lg:flex h-24 border-b border-white/10 items-center justify-between px-10 bg-black/20 backdrop-blur-md sticky top-0 z-30">
          <h1 className="text-[18px] font-medium text-zinc-300">TEKKNO kundeportal</h1>

          <div className="flex items-center gap-6">
            <button onClick={() => handleSectionSelect("tips")} className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-2.5 rounded-full text-[14px] font-medium transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              <Megaphone className="w-4 h-4 text-orange-400" /> Tips oss
            </button>

            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all outline-none">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border border-[#1a1a1e]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={12} className="w-[320px] bg-[#1a1a1e] border border-white/10 rounded-[20px] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                  <h3 className="text-[14px] font-bold text-white mb-3 px-2">Varsler</h3>
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div key={`${notification.title}-${notification.meta}`} className="p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                        <p className="text-[13px] text-white font-medium group-hover:text-orange-400 transition-colors">{notification.title}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">{notification.meta}</p>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 group text-left p-1.5 pr-4 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5 transition-all outline-none">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500/40 to-orange-600/20 border border-orange-500/20 text-white flex items-center justify-center font-bold text-[14px] shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    {avatarInitial}
                  </div>
                  <div className="leading-tight">
                    <p className="text-[14px] font-medium text-white group-hover:text-orange-400 transition-colors">{displayName}</p>
                    <p className="text-[12px] text-orange-300/70 font-medium">{topbarStatusLabel}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12} className="w-[280px] bg-[#1a1a1e] border border-white/10 rounded-[24px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-orange-500/40 to-orange-600/20 border border-orange-500/20 text-white flex items-center justify-center font-bold text-[18px] shadow-[0_0_15px_rgba(249,115,22,0.2)] overflow-hidden">
                    {avatarInitial}
                  </div>
                  <div className="leading-tight">
                    <p className="text-[16px] font-bold text-white mb-1">{displayName}</p>
                    <p className="text-[12px] font-bold text-orange-400/80 uppercase tracking-widest">{accountPlanLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSectionSelect("profil")} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[14px] font-medium transition-colors">
                    <UserIcon className="w-4 h-4" /> Profil
                  </button>
                  <button onClick={() => logout(true)} className="w-[52px] h-[52px] flex items-center justify-center rounded-2xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors" title="Logg ut">
                    <LogOut className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="w-full max-w-[1450px] mx-auto p-4 lg:p-8 flex-1">
          {isOverview && <KundeportalOversikt user={user} accountOverview={accountOverview} accountOverviewError={accountOverviewError} onNavigate={handleSectionSelect} />}

          {activeSection === "profil" && <ProfileCard user={user} userId={user.id} />}
          {activeSection === "abonnement" && (
            <SubscriptionCard
              paymentStatus={paymentStatus}
              upgradeOpen={upgradeOpen}
              onCloseUpgrade={() => setUpgradeOpen(false)}
              userId={user.id}
            />
          )}
          {activeSection === "betaling" && <PaymentHistoryCard userId={user.id} />}
          {activeSection === "nyhetsbrev" && <NewsletterCard userId={user.id} />}
          {activeSection === "lagrede" && <SavedArticlesCard userId={user.id} />}
          {activeSection === "sikkerhet" && (
            <div className="space-y-6">
              <SecurityCard user={user} />
              <TwoFactorCard />
            </div>
          )}
          {activeSection === "personvern" && <PrivacyCard onLogout={() => logout(true)} />}
          {activeSection === "eavis" && <EavisCard />}
          {activeSection === "tips" && <TipsOssCard />}
          {activeSection === "hjelp" && <HelpCenter />}
        </div>
      </main>
    </div>
  );
}

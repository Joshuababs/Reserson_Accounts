import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Check, CreditCard, FileText } from "lucide-react";
import logoWhite from "@/assets/logo_white.svg";
import logoBlack from "@/assets/logo_black.svg";
import { WhatsappButton } from "@/components/WhatsappButton";
import { useNotifications } from "@/components/notifications";
import { useSession } from "@/session";

/**
 * The frame every screen sits in — the merchant dashboard's auth layout
 * (components/modules/auth/v2/signupLayout.vue), ported so a customer arriving here
 * from app.reservonhq.com sees the screens they already know.
 *
 * Two modes: `signup` shows the onboarding steps down the dark rail; `others`
 * (sign in, forgot, reset) shows the product highlights instead.
 */
interface Props {
  currentStep?: number;
  type?: "signup" | "others";
  /** Defaults to "past the first step", which is when there is a session to end. */
  showLogout?: boolean;
  children: ReactNode;
}

const STEPS = ["Account", "Verify email", "Choose product", "Business details"];
const MOBILE_STEPS = ["Account", "Verify", "Product", "Business"];

const FEATURES: { icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; iconBg: string; iconColor: string; title: string; desc: string }[] = [
  {
    icon: CalendarDays,
    iconBg: "bg-orange-500/15",
    iconColor: "text-orange-400",
    title: "All your bookings in one place",
    desc: "Calendar, reminders, and your public booking page",
  },
  {
    icon: FileText,
    iconBg: "bg-teal-500/15",
    iconColor: "text-teal-400",
    title: "Invoices that get paid faster",
    desc: "Send, track, and get notified the moment you're paid",
  },
  {
    icon: CreditCard,
    iconBg: "bg-yellow-500/15",
    iconColor: "text-yellow-400",
    title: "Secure payments via Stripe",
    desc: "Reservon never stores your customers' card details",
  },
];

const TESTIMONIAL = {
  quote: "Set up took less than ten minutes — I had my first booking link out to customers the same afternoon.",
  author: "Early Reservon merchant",
};

const SUPPORT_WHATSAPP = "+353899508939";

export function AuthLayout({ currentStep = 1, type = "signup", showLogout, children }: Props) {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const { confirm, closeConfirm } = useNotifications();

  const stepStatus = (index: number): "done" | "active" | "upcoming" => {
    const stepNumber = index + 1;
    if (stepNumber < currentStep) return "done";
    if (stepNumber === currentStep) return "active";
    return "upcoming";
  };

  const initLogout = () => {
    confirm({
      type: "DANGER",
      title: "Logout",
      desc: "Are you sure you want to logout?",
      proceedText: "Logout",
      cancelText: "Cancel",
      callFunction: async () => {
        await signOut();
        closeConfirm();
        navigate("/signin", { replace: true });
      },
    });
  };

  const logoutVisible = showLogout ?? currentStep > 1;

  return (
    <main className="w-full min-h-screen bg-white overflow-hidden flex">
      <div className="hidden lg:flex relative w-full lg:w-[340px] xl:w-[500px] shrink-0 bg-[#0B0F1A] p-8 flex-col justify-between gap-10 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-secondary/10" />
        <div className="absolute -bottom-16 -right-10 w-52 h-52 rounded-full bg-primary/10" />

        <div className="relative z-[1] flex flex-col gap-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoWhite} alt="Reservon" className="w-[150px]" />
          </Link>

          {type === "signup" ? (
            <div className="flex flex-col gap-6">
              {STEPS.map((step, index) => {
                const status = stepStatus(index);
                return (
                  <div key={step} className="flex items-start gap-3">
                    <div
                      className={[
                        "w-8 h-8 rounded-full center shrink-0 border-2",
                        status === "done" ? "bg-primary border-primary" : "",
                        status === "active" ? "bg-secondary border-secondary" : "",
                        status === "upcoming" ? "border-white/25" : "",
                      ].join(" ")}
                    >
                      {status === "done" ? (
                        <Check size={16} strokeWidth={2.6} className="text-white" />
                      ) : (
                        <span className={`text-sm font-semibold ${status === "active" ? "text-white" : "text-white/40"}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 pt-1">
                      <span className={`text-sm font-semibold ${status === "active" ? "text-secondary" : "text-white"}`}>
                        {step}
                      </span>
                      <span className="text-xs text-white/40">
                        Step {index + 1} of {STEPS.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg center shrink-0 ${feature.iconBg}`}>
                    <feature.icon size={18} strokeWidth={2.2} className={feature.iconColor} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-semibold text-white">{feature.title}</span>
                    <span className="text-base text-white/50">{feature.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-[1] flex flex-col gap-3">
          <div className="border-t border-white/10" />
          <p className="text-sm lg:text-base text-white/70 italic leading-relaxed">“{TESTIMONIAL.quote}”</p>
          <p className="text-xs lg:text-sm text-white">— {TESTIMONIAL.author}</p>
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-8 min-h-screen p-4 md:p-6">
        <div className="flex items-center gap-4 justify-between lg:justify-end">
          <Link to="/" className="flex items-center gap-3 lg:hidden">
            <img src={logoBlack} alt="Reservon" className="w-[120px]" />
          </Link>
          {logoutVisible && (
            <button type="button" className="btn-primary py-2 bg-danger" onClick={initLogout}>
              Logout
            </button>
          )}
        </div>

        {type === "signup" && (
          <div className="lg:hidden flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              Step {currentStep} of {STEPS.length}
            </p>
            <div className="flex items-start">
              {MOBILE_STEPS.map((step, index) => {
                const status = stepStatus(index);
                return (
                  <div key={step} className="contents">
                    {index > 0 && (
                      <div className={`flex-1 h-0.5 mt-3.5 ${status !== "upcoming" ? "bg-primary" : "bg-[#E4E4E7]"}`} />
                    )}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div
                        className={[
                          "w-7 h-7 rounded-full center shrink-0 border-2 text-xs font-semibold",
                          status === "done" ? "bg-primary border-primary text-white" : "",
                          status === "active" ? "bg-white border-secondary text-secondary ring-4 ring-secondary/20" : "",
                          status === "upcoming" ? "bg-white border-[#D1D0D4] text-gray" : "",
                        ].join(" ")}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`text-[11px] font-medium text-center whitespace-nowrap ${status === "upcoming" ? "text-gray" : "text-black"}`}
                      >
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-grow center">{children}</div>
      </div>

      <WhatsappButton phone={SUPPORT_WHATSAPP} />
    </main>
  );
}

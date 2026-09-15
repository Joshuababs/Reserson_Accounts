import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import check from "@/assets/check.svg";
import cancel from "@/assets/cancel.svg";
import { ApiError } from "@/api";

/**
 * Toasts, the alert popup and the confirm popup, ported from the merchant
 * dashboard (composables/core/noification.ts, components/core/Toast,
 * components/modals/core/alert.vue and confirm.vue) so feedback here looks and
 * behaves the way it does on app.reservonhq.com.
 */

type ToastType = "Alert" | "ERROR" | "SUCCESS" | "WARNING";
type ConfirmType = "DANGER" | "SUCCESS" | "WARNING";

const TOAST_DURATION = 5000;

interface Toast {
  id: string;
  type: ToastType;
  msg: string;
  duration: number;
}

interface AlertState {
  type: ToastType;
  title: string;
  msg: string;
  buttonText: string;
  buttonAction: (() => void) | null;
  allowBgClose: boolean;
}

interface ConfirmState {
  type: ConfirmType;
  title: string;
  desc: string;
  proceedText: string;
  cancelText: string;
  callFunction: () => void | Promise<void>;
}

interface Notifications {
  toast: (input: { type: ToastType; msg: string; duration?: number }) => void;
  closeToast: (id: string) => void;
  alert: (input: {
    type: ToastType;
    title: string;
    msg: string;
    buttonText?: string;
    buttonAction?: (() => void) | null;
    allowBgClose?: boolean;
  }) => void;
  closeAlert: () => void;
  confirm: (input: {
    type: ConfirmType;
    title: string;
    desc: string;
    proceedText: string;
    cancelText: string;
    callFunction: () => void | Promise<void>;
  }) => void;
  closeConfirm: () => void;
}

const NotificationContext = createContext<Notifications | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const toast = useCallback<Notifications["toast"]>(({ type, msg, duration }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((list) => [...list, { id, type, msg, duration: duration || TOAST_DURATION }]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const alert = useCallback<Notifications["alert"]>(({ type, title, msg, buttonText, buttonAction, allowBgClose }) => {
    setAlertState({
      type,
      title,
      msg,
      buttonText: buttonText || "Ok",
      buttonAction: buttonAction ?? null,
      allowBgClose: allowBgClose !== undefined ? allowBgClose : true,
    });
  }, []);

  const closeAlert = useCallback(() => setAlertState(null), []);

  const confirm = useCallback<Notifications["confirm"]>((input) => {
    setConfirmBusy(false);
    setConfirmState(input);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(null);
    setConfirmBusy(false);
  }, []);

  const value = useMemo(
    () => ({ toast, closeToast, alert, closeAlert, confirm, closeConfirm }),
    [toast, closeToast, alert, closeAlert, confirm, closeConfirm],
  );

  const proceed = async () => {
    if (!confirmState) return;
    setConfirmBusy(true);
    try {
      await confirmState.callFunction();
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <aside className="fixed top-4 right-4 z-[1000] w-auto flex flex-col-reverse gap-4">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={closeToast} />
        ))}
      </aside>

      {alertState && (
        <Popup allowBgClose={alertState.allowBgClose} onClose={closeAlert}>
          <div className="flex flex-col gap-3 text-black text-center">
            <IconBubble kind={alertState.type} />
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl lg:text-3xl font-bold">{alertState.title}</h2>
              <p className="text-sm px-6">{alertState.msg}</p>
            </div>
            {alertState.buttonText && (
              <button
                type="button"
                className="btn-primary mt-8 lg:mt-16"
                onClick={() => {
                  alertState.buttonAction?.();
                  closeAlert();
                }}
              >
                {alertState.buttonText}
              </button>
            )}
          </div>
        </Popup>
      )}

      {confirmState && (
        <Popup allowBgClose={false} onClose={closeConfirm}>
          <div className="flex flex-col gap-3 text-black text-center">
            <IconBubble kind={confirmState.type} />
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl lg:text-3xl font-bold">{confirmState.title}</h2>
              <p className="text-sm px-6">{confirmState.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6 mt-8 lg:mt-16">
              <button type="button" className="btn-primary bg-primary/15 text-primary" onClick={closeConfirm}>
                {confirmState.cancelText}
              </button>
              <button type="button" disabled={confirmBusy} className="btn-primary" onClick={proceed}>
                {confirmBusy ? "processing..." : confirmState.proceedText}
              </button>
            </div>
          </div>
        </Popup>
      )}
    </NotificationContext.Provider>
  );
}

function Popup({
  allowBgClose,
  onClose,
  children,
}: {
  allowBgClose: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="bg-modal transition-all"
      onClick={(e) => {
        if (allowBgClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" className="modal flex flex-col !max-w-[500px] lg:p-8 gap-6">
        <div className="flex items-center gap-4 justify-between">
          <button type="button" aria-label="Close" className="ml-auto text-black" onClick={onClose}>
            <X size={16} strokeWidth={2.7} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function IconBubble({ kind }: { kind: ToastType | ConfirmType }) {
  const isBad = kind === "ERROR" || kind === "DANGER" || kind === "WARNING";
  const bg = kind === "WARNING" ? "bg-orange-600/20" : isBad ? "bg-[#FCE4D1]" : kind === "SUCCESS" ? "bg-[#D3EEDF]" : "bg-white";
  return (
    <div className={`w-[50px] h-[50px] center rounded-full mx-auto ${bg}`}>
      <img src={isBad ? cancel : check} alt="" className="w-[25px]" />
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(0));
    const timer = setTimeout(() => onClose(toast.id), toast.duration);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [toast.id, toast.duration, onClose]);

  const isBad = toast.type === "ERROR" || toast.type === "WARNING";
  const iconBg = toast.type === "WARNING" ? "bg-orange-600/20" : isBad ? "bg-[#FCE4D1]" : toast.type === "SUCCESS" ? "bg-[#D3EEDF]" : "bg-white";

  return (
    <div
      role="alert"
      className="toast-card relative overflow-hidden min-w-[300px] !max-w-[355px] md:!max-w-[400px] shadow-xl p-4 rounded-lg bg-[#A7DEBF]"
    >
      <div
        className="bg-white h-1 absolute bottom-0 left-0"
        style={{ width: `${width}%`, transition: `width ${toast.duration}ms linear` }}
      />
      <button type="button" aria-label="Dismiss" className="absolute top-1 right-1" onClick={() => onClose(toast.id)}>
        <X size={15} />
      </button>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full center shrink-0 ${iconBg}`}>
          <img src={isBad ? cancel : check} className="w-[18px]" alt="" />
        </div>
        <p className="text-black2 text-sm">{toast.msg}</p>
      </div>
    </div>
  );
}

export function useNotifications(): Notifications {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
}

/**
 * What the merchant dashboard's axios interceptor shows for a failed call: the
 * API's own message when there is one, a network hint when the request never got
 * an answer, and a generic line otherwise.
 */
export function errorMessage(err: unknown, fallback = "An error occured, please try again"): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof TypeError) return "Kindly check your network connection";
  return fallback;
}

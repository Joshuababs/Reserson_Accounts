import whatsapp from "@/assets/whatsapp.png";

/** The floating WhatsApp button every merchant auth screen carries. */
export function WhatsappButton({ phone }: { phone: string }) {
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed animate-bounce bottom-6 right-3 w-12 h-12 rounded-full overflow-hidden bg-green-500 shadow-lg center z-30"
    >
      <img src={whatsapp} alt="" />
    </a>
  );
}

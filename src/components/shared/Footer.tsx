import Link from "next/link";
import { Logo } from "./Logo";

const WhatsAppIcon = () => (
    <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current">
        <path d=" M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.315 0-.765.11-1.057.332-.308.24-.81.77-1.037 1.318-.282.68-.308 1.38-.308 1.983 0 .68.143 1.31.332 1.857.187.56.594 1.254 1.18 1.877.586.623 1.35 1.195 2.23 1.677.88.482 1.82.766 2.89.923.956.143 1.87.11 2.59-.062.75-.174 1.912-.91 2.23-1.58.332-.68.332-1.254.214-1.398-.11-.143-.332-.22-.6-.22z" />
        <path d=" M16 .0C7.16 0 0 7.16 0 16s7.16 16 16 16c9.02 0 16-7.16 16-16S24.84 0 16 0zm0 29.5C8.54 29.5 2.5 23.46 2.5 16S8.54 2.5 16 2.5 29.5 8.54 29.5 16 23.46 29.5 16 29.5z" />
    </svg>
)

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm7.424 7.61-2.22 10.457c-.122.569-.474.71-1.002.433l-3.415-2.522-1.654 1.593c-.18.18-.335.336-.684.336-.403 0-.495-.143-.684-.523l-1.077-3.51-3.23-1.002c-.569-.176-.574-.683.111-1.001l11.486-4.4c.554-.22.99.143.832.833z" />
    </svg>
)


export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-muted-foreground max-w-sm">
              Revolucionando el sector inmobiliario con tecnología de punta.
            </p>
             <p className="text-muted-foreground mt-8 text-sm">© {new Date().getFullYear()} Inmotec. Todos los derechos reservados.</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-foreground">Navegación</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition">Inicio</Link></li>
              <li><Link href="/properties" className="hover:text-primary transition">Propiedades</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition">Preguntas Frecuentes</Link></li>
              <li><Link href="/login" className="hover:text-primary transition">Mi Cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-foreground">Redes Sociales</h4>
            <div className="flex items-center gap-4">
                <Link href="https://t.me/InmoTecnologia" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <TelegramIcon />
                    <span className="sr-only">Telegram</span>
                </Link>
                 <Link href="https://wa.me/message/DGRIYRB2PBZVC1" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <WhatsAppIcon />
                    <span className="sr-only">WhatsApp</span>
                </Link>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">soporte@inmotec.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

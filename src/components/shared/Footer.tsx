import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-muted-foreground">
              Revolucionando el sector inmobiliario con tecnología de punta.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-foreground">Navegación</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition">Inicio</Link></li>
              <li><Link href="/properties" className="hover:text-primary transition">Propiedades</Link></li>
              <li><Link href="/login" className="hover:text-primary transition">Mi Cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-foreground">Contacto</h4>
            <p className="text-muted-foreground">soporte@inmosmart.com</p>
            <p className="text-muted-foreground mt-4 text-sm">© {new Date().getFullYear()} InmoSmart. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

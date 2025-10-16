
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "¿Cuál es el monto mínimo para invertir?",
    answer: "Actualmente puedes comenzar a invertir desde $300 pesos. Dependiendo del proyecto, las oportunidades van desde $300 hasta $15,000 pesos por inversión. Esta flexibilidad te permite empezar con poco e ir creciendo tu portafolio según tus posibilidades. Empieza hoy mismo desde $300 y da tu primer paso en el mundo de la inversión Inmobiliaria."
  },
  {
    question: "¿Qué rendimiento puedo esperar y cada cuánto recibo ganancias?",
    answer: "Nuestros proyectos ofrecen un rendimiento desde el 10% diario, dependiendo del tipo de inversión y el plazo. Las ganancias se comienzan a reflejar de forma diaria, y puedes consultarlas en tiempo real desde la app. Recuerda que cada proyecto tiene condiciones específicas, por lo que te recomendamos revisar los detalles antes de invertir. Invierte y empieza a ver resultados desde el primer día."
  },
  {
    question: "¿Puedo retirar mi inversión en cualquier momento?",
    answer: "Sí, puedes retirar tus ganancias en cualquier momento, siempre y cuando el monto mínimo a retirar sea de $100 pesos. Una vez que inicies un retiro, deberás esperar a que se procese completamente antes de poder hacer uno nuevo. Tú decides cuándo retirar: sin plazos forzosos ni complicaciones."
  },
  {
    question: "¿Cómo seleccionan las propiedades en las que se invierte?",
    answer: "Nuestro equipo analiza cada propiedad cuidadosamente antes de ponerla disponible en la app. Tomamos en cuenta factores como ubicación estratégica, potencial de rentabilidad, plusvalía y demanda del mercado. Solo se eligen proyectos que ofrecen una buena relación entre riesgo y beneficio, para que tu inversión tenga mayores posibilidades de crecer. Invertimos tiempo en seleccionar bien, para que tú inviertas con más seguridad."
  },
  {
    question: "¿Está regulada la plataforma o respaldada legalmente?",
    answer: "Sí. Operamos bajo un marco legal que cumple con las leyes mexicanas, y trabajamos constantemente para garantizar transparencia y seguridad en cada inversión. Todas las propiedades cuentan con documentación legal en regla, y los procesos están diseñados para proteger tanto tu dinero como tus derechos como inversionista. Queremos que inviertas con confianza, sabiendo que todo está bien respaldado."
  },
  {
    question: "¿Mi inversión está segura?",
    answer: "Tu inversión está protegida por un proceso sólido: cada proyecto pasa por una revisión legal y financiera antes de ser publicado en la app. Además, trabajamos con propiedades reales y verificadas, lo que le da respaldo tangible a tu dinero. Usamos medidas de seguridad digital y protección de datos, y tú siempre tienes control sobre tu inversión y tus retiros. Tu dinero trabaja en proyectos reales, bien seleccionados y con total transparencia."
  },
  {
    question: "¿Cómo puedo recargar mi saldo?",
    answer: "Puedes recargar tu saldo desde la sección 'Mi Cuenta' > 'Depositar Fondos'. Aceptamos transferencias y depósitos bancarios."
  },
  {
    question: "¿Cómo puedo contactar con soporte?",
    answer: "A través de nuestras redes sociales o correo electrónico, un ejecutivo de parte de nuestro equipo estará listo para ayudarte."
  }
];

export default function FaqPage() {
  return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-foreground font-headline">Preguntas Frecuentes</h1>
          <p className="text-muted-foreground mt-2 text-lg">Encuentra respuestas a las dudas más comunes sobre Inmotec.</p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
  );
}

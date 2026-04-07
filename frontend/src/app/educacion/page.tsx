'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import {
  BookOpen, TrendingUp, BarChart2, Zap, Shield, Flame,
  DollarSign, PieChart, Repeat, AlertTriangle, ChevronDown, ChevronUp,
  GraduationCap, Star, Target, Clock, Globe
} from 'lucide-react';

/* ── Types ─────────────────────────────── */
interface Topic {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  content: Section[];
}

interface Section {
  heading: string;
  body: string;
  tip?: string;
  example?: string;
}

/* ── Data ──────────────────────────────── */
const TOPICS: Topic[] = [
  {
    id: 'acciones',
    icon: <TrendingUp size={22} />,
    title: 'Acciones',
    subtitle: '¿Qué es ser dueño de una empresa?',
    color: '#00d4aa',
    content: [
      {
        heading: '¿Qué es una acción?',
        body: 'Una acción (o "stock" en inglés) es una pequeña parte de la propiedad de una empresa. Cuando comprás una acción de Apple (AAPL), te volvés dueño de una fracción mínima de esa compañía. Si la empresa crece y gana más dinero, el valor de tu acción sube.',
        example: 'Imaginá que una empresa vale $1.000.000 y está dividida en 1.000.000 acciones de $1 cada una. Si comprás 100 acciones, sos dueño del 0.01% de esa empresa.',
      },
      {
        heading: '¿Cómo ganás dinero con acciones?',
        body: 'Hay dos formas principales: (1) Plusvalía: el precio de la acción sube y vendés más caro de lo que compraste. (2) Dividendos: algunas empresas reparten una parte de sus ganancias entre los accionistas periódicamente.',
        tip: 'Empresas maduras como Coca-Cola o Johnson & Johnson suelen pagar dividendos estables, mientras que startups tecnológicas reinvierten sus ganancias para crecer más rápido.',
      },
      {
        heading: 'Riesgo de las acciones',
        body: 'El valor de las acciones puede bajar, incluso hasta cero si la empresa quiebra. Son más volátiles que los bonos o los depósitos a plazo. Sin embargo, históricamente, las acciones han sido la clase de activo con mayor rendimiento a largo plazo.',
      },
      {
        heading: 'Tipos de acciones',
        body: 'Acciones ordinarias (common stock): te dan derecho a voto en decisiones de la empresa. Acciones preferentes (preferred stock): tienen prioridad en el cobro de dividendos pero generalmente no dan derecho a voto. También se clasifican por capitalización: Large Cap (empresas grandes y estables), Mid Cap y Small Cap (empresas medianas/pequeñas con más riesgo pero mayor potencial de crecimiento).',
      },
    ],
  },
  {
    id: 'etfs',
    icon: <PieChart size={22} />,
    title: 'ETFs',
    subtitle: 'Diversificación en un solo click',
    color: '#4e8cff',
    content: [
      {
        heading: '¿Qué es un ETF?',
        body: 'Un ETF (Exchange-Traded Fund o Fondo Cotizado en Bolsa) es una canasta de activos (acciones, bonos, commodities) que cotiza en la bolsa igual que una acción. En lugar de comprar una sola empresa, comprás una pequeña parte de muchas.',
        example: 'El ETF "SPY" replica el índice S&P 500, que incluye las 500 empresas más grandes de EE.UU. Al comprar 1 acción de SPY, estás invirtiendo en 500 empresas simultáneamente.',
      },
      {
        heading: '¿Por qué son populares?',
        body: 'Diversificación automática: si una empresa dentro del ETF baja, otras pueden compensar. Bajo costo: los ETFs indexados tienen comisiones (expense ratios) muy bajas, a veces de 0.03% anual. Liquidez: podés comprarlos y venderlos en cualquier momento durante el horario de mercado.',
        tip: 'Warren Buffett recomendó públicamente que la mayoría de los inversores comunes pongan su dinero en un ETF del S&P 500 en lugar de elegir acciones individuales.',
      },
      {
        heading: 'ETFs más conocidos',
        body: 'SPY / VOO: replican el S&P 500 (las 500 mayores empresas de EEUU). QQQ: replica el Nasdaq-100, con gran peso en tecnología (Apple, Microsoft, Nvidia). VTI: el mercado total de acciones de EEUU. EEM: mercados emergentes (Brasil, China, India). GLD: precio del oro.',
      },
      {
        heading: 'ETFs vs. Fondos Mutuos',
        body: 'Ambos agrupan dinero de muchos inversores para comprar una canasta de activos. La diferencia clave es que los ETFs cotizan en tiempo real durante el día de mercado (como acciones), mientras que los fondos mutuos solo tienen un precio al cierre del día. Los ETFs suelen tener menores comisiones.',
      },
    ],
  },
  {
    id: 'crypto',
    icon: <Zap size={22} />,
    title: 'Criptomonedas',
    subtitle: 'El dinero digital descentralizado',
    color: '#ffd32a',
    content: [
      {
        heading: '¿Qué es una criptomoneda?',
        body: 'Una criptomoneda es una moneda digital que utiliza criptografía para asegurar las transacciones y controlar la creación de nuevas unidades. A diferencia del dólar o el euro, no está controlada por ningún gobierno o banco central: es descentralizada.',
        example: 'Bitcoin (BTC) fue la primera criptomoneda, creada en 2009 por el anónimo "Satoshi Nakamoto". Funciona sobre una tecnología llamada blockchain: una cadena de bloques de transacciones verificadas por miles de computadoras alrededor del mundo.',
      },
      {
        heading: 'Las principales criptomonedas',
        body: 'Bitcoin (BTC): la original, usada como reserva de valor o "oro digital". Ethereum (ETH): plataforma de contratos inteligentes y aplicaciones descentralizadas (DeFi, NFTs). Solana (SOL): blockchain muy rápida y de bajo costo, popular para aplicaciones. Las altcoins son todas las demás criptomonedas: miles de proyectos con distintos objetivos.',
        tip: 'La dominancia de Bitcoin (su porcentaje del mercado cripto total) es un indicador importante: cuando sube, el mercado se "refugia" en BTC; cuando baja, el capital fluye a altcoins (esto se llama "altseason").',
      },
      {
        heading: 'Altísima volatilidad',
        body: 'Las criptomonedas son los activos más volátiles del mercado financiero. No es raro ver variaciones de 30%, 50% o incluso 90% en pocos meses, tanto al alza como a la baja. Bitcoin llegó a caer 80% desde sus máximos en varios ciclos históricos.',
      },
      {
        heading: 'Conceptos clave en crypto',
        body: 'Wallet (billetera): software que guarda tus claves privadas y te permite enviar/recibir cripto. DeFi: finanzas descentralizadas, servicios financieros sin intermediarios. NFT: token no fungible, representación digital única de un activo. Halving: evento en Bitcoin que reduce a la mitad la recompensa a los mineros, históricamente asociado con subidas de precio.',
      },
    ],
  },
  {
    id: 'bonos',
    icon: <Shield size={22} />,
    title: 'Bonos',
    subtitle: 'Prestame plata y te pago intereses',
    color: '#00c853',
    content: [
      {
        heading: '¿Qué es un bono?',
        body: 'Un bono es un instrumento de deuda. Cuando comprás un bono, le estás prestando dinero al emisor (puede ser un gobierno o una empresa). A cambio, el emisor se compromete a devolverte el capital al vencimiento y a pagarte intereses periódicos (llamados "cupones").',
        example: 'El gobierno de EE.UU. emite los Treasuries (bonos del Tesoro). Si comprás un bono del Tesoro a 10 años con tasa del 4.5%, recibirás el 4.5% de interés anual durante 10 años, y al final te devuelven el capital inicial.',
      },
      {
        heading: 'Tipos de bonos',
        body: 'Bonos soberanos: emitidos por gobiernos (T-Bills, T-Notes, T-Bonds en EE.UU.; BOPREAL, LETES en Argentina). Bonos corporativos: emitidos por empresas (Apple, Microsoft también emiten deuda). Investment Grade: empresas con alta calificación crediticia, menor riesgo. High Yield (Junk Bonds): mayor rendimiento pero con más riesgo de impago.',
      },
      {
        heading: 'Relación precio-tasa de interés',
        body: 'Este es el punto más contraintuitivo de los bonos: cuando las tasas de interés suben, el precio de los bonos existentes baja (y viceversa). Esto se debe a que un bono antiguo que paga menos cupón es menos atractivo que uno nuevo que paga más.',
        tip: 'En épocas de incertidumbre económica, los inversores "huyen a la calidad" comprando bonos del Tesoro de EE.UU., considerados los activos más seguros del mundo.',
      },
    ],
  },
  {
    id: 'inversiones-seguras',
    icon: <Shield size={22} />,
    title: 'Inversiones Seguras (Conservadoras)',
    subtitle: 'Bajo riesgo, retorno predecible',
    color: '#00c853',
    content: [
      {
        heading: '¿Qué son las inversiones conservadoras?',
        body: 'Son instrumentos diseñados para preservar el capital y obtener un retorno modesto pero predecible. Son ideales para personas con baja tolerancia al riesgo, o para el dinero que necesitás en el corto plazo (menos de 3 años).',
      },
      {
        heading: 'Ejemplos de inversiones conservadoras',
        body: '• Bonos del Tesoro de EE.UU. (T-Bills, T-Notes): respaldados por el gobierno más sólido del mundo.\n• ETFs de bonos (BND, AGG): diversifican en cientos de bonos.\n• Certificados de Depósito (CDs) / Plazos Fijos: garantizan una tasa fija durante un período.\n• Fondos Money Market: invierten en instrumentos de muy corto plazo, casi equivalentes al efectivo.\n• Oro: históricamente actúa como reserva de valor frente a la inflación.',
        tip: 'La regla general es: cuanto más tiempo tenés para invertir, más riesgo podés asumir. Si necesitás el dinero en menos de 2 años, priorizá la seguridad sobre el rendimiento.',
      },
      {
        heading: 'Rendimientos esperados',
        body: 'Históricamente, las inversiones conservadoras rinden entre 2% y 6% anual en términos reales (descontando inflación). Es mucho menos que las acciones, pero con una volatilidad mínima. La protección del capital es la prioridad.',
      },
    ],
  },
  {
    id: 'inversiones-agresivas',
    icon: <Flame size={22} />,
    title: 'Inversiones Agresivas',
    subtitle: 'Alto riesgo, alto potencial de retorno',
    color: '#ff3d57',
    content: [
      {
        heading: '¿Qué son las inversiones agresivas?',
        body: 'Son instrumentos con alta volatilidad y potencial de grandes ganancias (o grandes pérdidas). Son adecuadas solo para inversores con alta tolerancia al riesgo, horizonte temporal largo (5+ años), y que pueden permitirse perder ese dinero sin afectar su calidad de vida.',
      },
      {
        heading: 'Ejemplos de inversiones agresivas',
        body: '• Acciones de Small Cap o startups: mayor potencial pero probabilidad de quiebra.\n• Criptomonedas: especialmente altcoins, que pueden subir 10x o bajar 90%.\n• Opciones y derivados: instrumentos complejos con apalancamiento.\n• Commodities: petróleo, commodities agrícolas con alta volatilidad.\n• Mercados emergentes: mayor riesgo político y monetario.\n• Acciones de sectores disruptivos (biotech, IA): alta incertidumbre, alto potencial.',
        tip: 'Regla de oro: NUNCA inviertas en activos agresivos dinero que necesitás para vivir. Solo usá capital que podés permitirte perder completamente.',
      },
      {
        heading: 'El rol del tiempo en inversiones agresivas',
        body: 'El tiempo es el mejor aliado. Históricamente, el S&P 500 nunca ha dado pérdidas en períodos de 20 años. A mayor horizonte temporal, menor es tu riesgo real. Un inversor joven con 30 años por delante puede asumir mucho más riesgo que uno de 60.',
      },
    ],
  },
  {
    id: 'diversificacion',
    icon: <Globe size={22} />,
    title: 'Diversificación',
    subtitle: 'No pongas todos los huevos en una canasta',
    color: '#4e8cff',
    content: [
      {
        heading: '¿Por qué diversificar?',
        body: 'La diversificación consiste en distribuir el capital entre distintos tipos de activos, sectores y regiones geográficas. El objetivo es que cuando un activo baja, otros mantengan o suban su valor, reduciendo la volatilidad total de tu cartera.',
        example: 'En 2022, las acciones tecnológicas caían 30-40% mientras el dólar y los bonos de corto plazo subían. Un inversor diversificado sufrió mucho menos que uno con todo en tech.',
      },
      {
        heading: 'Cómo diversificar correctamente',
        body: 'Entre clases de activos: acciones, bonos, efectivo, commodities, cripto.\nPor sectores: tecnología, salud, energía, consumo, finanzas.\nPor geografía: EE.UU., Europa, mercados emergentes.\nPor tiempo (diversificación temporal): invertir de forma periódica en lugar de todo de una sola vez (Dollar Cost Averaging).',
        tip: 'Un portafolio clásico "60/40" (60% acciones, 40% bonos) ha sido durante décadas el estándar para inversores moderados.',
      },
      {
        heading: 'Correlación entre activos',
        body: 'Los activos pueden estar correlacionados de forma positiva (suben y bajan juntos) o negativa (se mueven en sentido opuesto). La verdadera diversificación requiere activos de baja correlación entre sí. Por ejemplo, el oro históricamente tiene correlación negativa con las acciones.',
      },
    ],
  },
  {
    id: 'conceptos-clave',
    icon: <BookOpen size={22} />,
    title: 'Conceptos Clave del Mercado',
    subtitle: 'El vocabulario que todo inversor debe saber',
    color: '#ff8c00',
    content: [
      {
        heading: 'Mercado Alcista (Bull Market) vs. Bajista (Bear Market)',
        body: 'Bull Market: período sostenido de subida de precios (20%+ desde mínimos recientes). Optimismo y confianza prevalen. Bear Market: caída del 20% o más desde máximos recientes. Pesimismo e incertidumbre. El S&P 500 ha estado en Bull Market la mayor parte de su historia.',
      },
      {
        heading: 'Liquidez',
        body: 'La liquidez es la facilidad con la que podés convertir un activo en efectivo sin afectar su precio. Las acciones de grandes empresas y ETFs son muy líquidos (podés vender en segundos). Los bienes raíces son ilíquidos (pueden tardar meses en venderse).',
      },
      {
        heading: 'Volatilidad e indicadores técnicos',
        body: 'RSI (Índice de Fuerza Relativa): mide si un activo está "sobrecomprado" (>70) o "sobrevendido" (<30).\nMACD: indica la dirección y momentum de la tendencia.\nMedia Móvil: promedio del precio en un período, sirve para identificar tendencias.\nVolumen: cuántas acciones se negociaron. Valida o invalida los movimientos de precio.',
        tip: 'Los indicadores técnicos analizan el pasado para estimar tendencias futuras. Son útiles pero no predictivos: NINGÚN indicador predice el futuro con certeza.',
      },
      {
        heading: 'P/E Ratio (Relación Precio/Beneficio)',
        body: 'El P/E ratio compara el precio de una acción con las ganancias por acción de la empresa. Un P/E bajo puede indicar que la empresa es barata (o que está en problemas). Un P/E alto puede indicar expectativas de crecimiento futuro (o que está sobrevalorada). El S&P 500 tiene históricamente un P/E promedio de ~16. Durante burbujas puede superar 30.',
      },
      {
        heading: 'Dollar Cost Averaging (DCA)',
        body: 'Estrategia de invertir una cantidad fija de dinero en intervalos regulares (ej: $200 por mes en ETFs del S&P 500), independientemente del precio actual. Cuando el mercado está bajo, comprás más unidades; cuando está alto, comprás menos. A largo plazo, esto reduce el impacto de la volatilidad.',
        example: 'Invertir $200/mes durante 30 años en el S&P 500 (rendimiento histórico ~10% anual) resultaría en aproximadamente $452.000 partiendo de $72.000 invertidos en total.',
      },
      {
        heading: 'Interés Compuesto',
        body: 'El interés compuesto es ganar intereses sobre tus intereses previos. Albert Einstein lo llamó "la octava maravilla del mundo". Con un 10% anual: $1.000 se convierte en ~$6.727 en 20 años y ~$17.449 en 30 años. Por eso empezar a invertir pronto es crucial.',
      },
    ],
  },
  {
    id: 'como-empezar',
    icon: <Target size={22} />,
    title: '¿Cómo Empezar a Invertir?',
    subtitle: 'Guía práctica para el inversor principiante',
    color: '#00d4aa',
    content: [
      {
        heading: 'Paso 1: Construí tu fondo de emergencia',
        body: 'Antes de invertir, asegurate de tener entre 3 y 6 meses de gastos en una cuenta de ahorro líquida. Las inversiones pueden caer 30-50% en el corto plazo. Si necesitás ese dinero de urgencia, podrías verte obligado a vender en pérdida.',
      },
      {
        heading: 'Paso 2: Pagá las deudas de alto interés',
        body: 'Tener deudas al 20-30% anual (tarjetas de crédito) y a la vez invertir esperando 10% anual es matemáticamente ilógico. Liquidá primero las deudas caras antes de invertir.',
      },
      {
        heading: 'Paso 3: Definí tu perfil de riesgo y objetivos',
        body: '• ¿Para qué querés el dinero? (retiro, casa, viaje)\n• ¿En cuánto tiempo?\n• ¿Cuánta caída toleras sin vender por pánico?\nEstas respuestas definen si sos un inversor conservador, moderado o agresivo.',
      },
      {
        heading: 'Paso 4: Abrí una cuenta de corretaje',
        body: 'En EE.UU.: Fidelity, Schwab, Interactive Brokers (sin comisiones, regulados). En Argentina: IOL Invertironline, Balanz Capital, Portfolio Personal. Para cripto: Binance, Coinbase, Kraken. Verificá siempre que la plataforma esté regulada por el organismo correspondiente.',
        tip: 'Para principiantes, Interactive Brokers tiene acceso a mercados globales con comisiones muy bajas y está disponible para residentes de muchos países de Latinoamérica.',
      },
      {
        heading: 'Paso 5: Empezá simple — ETFs indexados',
        body: 'Para la gran mayoría de inversores, la mejor estrategia es invertir mensualmente en 1 o 2 ETFs amplios (ej: VTI + VXUS o solo VOO), y mantenerlos a largo plazo. Evitá seleccionar acciones individuales hasta tener más experiencia.',
      },
    ],
  },
  {
    id: 'errores-comunes',
    icon: <AlertTriangle size={22} />,
    title: 'Errores Comunes del Principiante',
    subtitle: 'Aprendé de los errores más frecuentes',
    color: '#ff3d57',
    content: [
      {
        heading: 'FOMO — Fear of Missing Out',
        body: 'Comprar un activo solo porque "está subiendo mucho" o "todos lo están comprando". Generalmente cuando el FOMO es masivo, el activo ya llegó a su máximo. Los grandes crashes de cripto (2021, 2017) ocurrieron cuando el interés público era máximo.',
      },
      {
        heading: 'Vender en pánico',
        body: 'Vender cuando el mercado cae fuerte es uno de los errores más costosos. Históricamente, el S&P 500 siempre se recuperó de todas las caídas (incluyendo el crack del 29, el 2008, el COVID). Vender durante una caída "cristaliza" la pérdida.',
        tip: 'Si la caída del mercado te quita el sueño, es señal de que tomaste más riesgo del que podés soportar emocionalmente. Revisá tu perfil de riesgo.',
      },
      {
        heading: 'Intentar "hacer timing" al mercado',
        body: 'Creer que podés predecir cuándo el mercado va a subir o bajar para comprar en el mínimo y vender en el máximo. Incluso los profesionales fallan sistemáticamente en esto. "Time in the market beats timing the market".',
      },
      {
        heading: 'Invertir en lo que no entendés',
        body: 'Regla de Warren Buffett: nunca inviertas en algo cuyo modelo de negocio no podés explicar en pocas palabras. Si no entendés cómo un proyecto genera valor, no inviertas en él.',
      },
      {
        heading: 'No diversificar / Poner todo en un solo activo',
        body: 'Empresas que parecían invencibles han quebrado: Enron, Lehman Brothers, FTX. Diversificar no elimina el riesgo pero lo distribuye. Nunca pongas más del 5-10% de tu cartera en un solo activo de alto riesgo.',
      },
    ],
  },
];

/* ── Accordion Card ─────────────────────── */
function TopicCard({ topic }: { topic: Topic }) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${open ? topic.color + '44' : 'var(--bg-border)'}`,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        boxShadow: open ? `0 0 24px ${topic.color}18` : 'none',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '18px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: `${topic.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: topic.color, flexShrink: 0,
        }}>
          {topic.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{topic.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{topic.subtitle}</div>
        </div>
        <div style={{ color: topic.color, transition: 'transform 0.2s', transform: open ? 'rotate(0)' : 'none' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Content */}
      {open && (
        <div style={{ borderTop: `1px solid ${topic.color}22` }}>
          {/* Section tabs */}
          <div style={{
            display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--bg-border)',
            background: 'var(--bg-surface)', padding: '0 16px',
          }}>
            {topic.content.map((section, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                style={{
                  padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  color: activeSection === i ? topic.color : 'var(--text-muted)',
                  borderBottom: `2px solid ${activeSection === i ? topic.color : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                {section.heading.length > 30 ? section.heading.slice(0, 28) + '…' : section.heading}
              </button>
            ))}
          </div>

          {/* Active section content */}
          <div style={{ padding: '24px 20px', animationName: 'fadeIn', animationDuration: '0.3s', animationFillMode: 'both' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: topic.color, marginBottom: 12 }}>
              {topic.content[activeSection].heading}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 14, whiteSpace: 'pre-line' }}>
              {topic.content[activeSection].body}
            </p>
            {topic.content[activeSection].example && (
              <div style={{
                background: `${topic.color}11`,
                border: `1px solid ${topic.color}33`,
                borderRadius: 10, padding: '12px 16px', marginBottom: 12,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: topic.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  📊 Ejemplo
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {topic.content[activeSection].example}
                </p>
              </div>
            )}
            {topic.content[activeSection].tip && (
              <div style={{
                background: '#ffd32a11',
                border: '1px solid #ffd32a33',
                borderRadius: 10, padding: '12px 16px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  💡 Pro Tip
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {topic.content[activeSection].tip}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Quick Quiz ─────────────────────────── */
const QUIZ_ITEMS = [
  {
    q: '¿Qué es una acción?',
    options: ['Un préstamo al gobierno', 'Una fracción de la propiedad de una empresa', 'Una moneda digital', 'Un contrato de seguro'],
    correct: 1,
  },
  {
    q: '¿Qué significa DCA (Dollar Cost Averaging)?',
    options: ['Comprar solo cuando el mercado baja', 'Invertir todo de una sola vez', 'Invertir un monto fijo periódicamente', 'Cambiar divisas frecuentemente'],
    correct: 2,
  },
  {
    q: '¿Cuál de estos activos es generalmente el más volátil?',
    options: ['Bonos del Tesoro de EE.UU.', 'ETF del S&P 500', 'Criptomonedas altcoins', 'Depósito a plazo fijo'],
    correct: 2,
  },
  {
    q: 'Si las tasas de interés suben, ¿qué pasa con el precio de los bonos existentes?',
    options: ['Suben', 'Bajan', 'Se mantienen igual', 'Depende del sector'],
    correct: 1,
  },
];

function QuickQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === QUIZ_ITEMS[current].correct) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 < QUIZ_ITEMS.length) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setDone(true);
      }
    }, 1200);
  };

  const reset = () => { setCurrent(0); setSelected(null); setScore(0); setDone(false); };

  if (done) {
    const pct = Math.round((score / QUIZ_ITEMS.length) * 100);
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{pct >= 75 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{score}/{QUIZ_ITEMS.length} correctas</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          {pct >= 75 ? '¡Excelente! Ya entendés los conceptos fundamentales.' :
           pct >= 50 ? 'Bien, pero te conviene repasar algunos temas.' :
           'Te recomendamos leer los temas antes de invertir.'}
        </div>
        <button className="btn btn-primary" onClick={reset}>Reintentar</button>
      </div>
    );
  }

  const q = QUIZ_ITEMS[current];
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pregunta {current + 1} de {QUIZ_ITEMS.length}</span>
        <span className="badge badge-accent">{score} correctas</span>
      </div>
      <div style={{ height: 3, background: 'var(--bg-border)', borderRadius: 99, marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${((current) / QUIZ_ITEMS.length) * 100}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, lineHeight: 1.5 }}>{q.q}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = 'var(--bg-surface)';
          let border = 'var(--bg-border)';
          let color = 'var(--text-primary)';
          if (selected !== null) {
            if (i === q.correct) { bg = 'var(--green-dim)'; border = 'var(--green)'; color = 'var(--green)'; }
            else if (i === selected && i !== q.correct) { bg = 'var(--red-dim)'; border = 'var(--red)'; color = 'var(--red)'; }
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} style={{
              padding: '12px 16px', borderRadius: 8, textAlign: 'left',
              background: bg, border: `1px solid ${border}`,
              color, cursor: selected !== null ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
            }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Glosario rápido ─────────────────── */
const GLOSSARY: { term: string; def: string }[] = [
  { term: 'Ticker', def: 'Código abreviado que identifica un activo en la bolsa (AAPL = Apple, BTC-USD = Bitcoin).' },
  { term: 'Portafolio', def: 'El conjunto total de inversiones que posee una persona o institución.' },
  { term: 'Liquidez', def: 'Facilidad para convertir un activo en efectivo rápidamente sin perder valor.' },
  { term: 'Bull Market', def: 'Mercado alcista: período de subida sostenida de precios (+20% desde mínimos).' },
  { term: 'Bear Market', def: 'Mercado bajista: caída del 20% o más desde máximos recientes.' },
  { term: 'Dividendo', def: 'Pago periódico de una empresa a sus accionistas como parte de las ganancias.' },
  { term: 'P/E Ratio', def: 'Precio de la acción dividido las ganancias por acción. Mide si está cara o barata.' },
  { term: 'Diversificación', def: 'Distribuir el riesgo invirtiendo en distintos activos, sectores y geografías.' },
  { term: 'Inflación', def: 'Aumento sostenido del nivel de precios. "Come" el poder adquisitivo del dinero guardado.' },
  { term: 'Interés compuesto', def: 'Ganar intereses sobre los intereses acumulados. El motor del crecimiento a largo plazo.' },
  { term: 'Blockchain', def: 'Registro digital descentralizado e inmutable de transacciones. Base tecnológica de las criptos.' },
  { term: 'Volatilidad', def: 'Medida de cuánto fluctúa el precio de un activo. Mayor volatilidad = mayor riesgo/oportunidad.' },
  { term: 'Stop Loss', def: 'Orden automática para vender un activo si cae a un precio determinado, limitando pérdidas.' },
  { term: 'Hedge', def: 'Estrategia para compensar riesgos de una inversión tomando una posición contraria.' },
  { term: 'Apalancamiento', def: 'Usar deuda o derivados para multiplicar la exposición. Amplifica ganancias Y pérdidas.' },
  { term: 'Capitalización de mercado', def: 'Precio de la acción × número total de acciones. Mide el tamaño de una empresa.' },
];

function GlossaryGrid() {
  const [filter, setFilter] = useState('');
  const filtered = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(filter.toLowerCase()) ||
    g.def.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <div>
      <input
        className="input"
        placeholder="Buscar término..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {filtered.map(g => (
          <div key={g.term} style={{
            background: 'var(--bg-surface)', borderRadius: 10,
            border: '1px solid var(--bg-border)', padding: '12px 14px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginBottom: 4 }}>{g.term}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{g.def}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No se encontró el término.</p>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────── */
export default function EducacionPage() {
  const [tab, setTab] = useState<'temas' | 'quiz' | 'glosario'>('temas');

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ paddingTop: 28, paddingBottom: 60 }}>

        {/* Hero */}
        <div style={{
          marginBottom: 32, padding: '28px 32px', borderRadius: 16,
          background: 'linear-gradient(135deg, #00d4aa18, #4e8cff18)',
          border: '1px solid #00d4aa33',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={28} color="#000" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>
                Centro de <span className="gradient-text">Educación Financiera</span>
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Todo lo que necesitás saber para empezar a invertir con confianza
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { icon: <BookOpen size={13} />, label: '10 temas esenciales' },
              { icon: <Star size={13} />, label: 'Para principiantes' },
              { icon: <Clock size={13} />, label: '~20 min de lectura' },
              { icon: <Target size={13} />, label: 'Quiz interactivo' },
            ].map(pill => (
              <span key={pill.label} className="badge badge-accent" style={{ fontSize: 12, padding: '4px 12px', gap: 6 }}>
                {pill.icon} {pill.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar" style={{ marginBottom: 24 }}>
          {([['temas', '📚 Temas'], ['quiz', '🧠 Quiz'], ['glosario', '📖 Glosario']] as const).map(([key, label]) => (
            <button key={key} className={`tab-item ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* Temas */}
        {tab === 'temas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TOPICS.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
            <div style={{
              marginTop: 8, padding: '14px 16px', borderRadius: 10,
              background: 'var(--yellow-dim)', border: '1px solid #ffd32a33',
              fontSize: 12, color: 'var(--yellow)', lineHeight: 1.7,
            }}>
              ⚠️ <strong>Aviso Legal:</strong> Todo el contenido de esta sección es puramente educativo e informativo.
              No constituye asesoramiento financiero ni recomendación de inversión. Siempre consultá a un asesor financiero
              certificado antes de tomar decisiones de inversión.
            </div>
          </div>
        )}

        {/* Quiz */}
        {tab === 'quiz' && (
          <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🧠</span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Quiz de Conocimientos</span>
            </div>
            <QuickQuiz />
          </div>
        )}

        {/* Glosario */}
        {tab === 'glosario' && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 20 }}>📖</span>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Glosario Financiero</span>
              <span className="badge badge-accent">{GLOSSARY.length} términos</span>
            </div>
            <GlossaryGrid />
          </div>
        )}

      </div>
    </>
  );
}

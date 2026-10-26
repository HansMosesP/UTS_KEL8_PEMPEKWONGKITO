"use client";

import { useEffect, useState } from "react";
import { useStore } from "../../lib/store";
import { useSiteCopy } from "../shared/use-site-copy";

const anatomy = [
  [
    "Kulit Luar Pempek",
    "Lapisan luar memberi tekstur khas serta melindungi isian di dalamnya.",
    "Pelindung & tekstur",
  ],
  [
    "Adonan Ikan",
    "Ikan tenggiri pilihan memberi rasa gurih khas Palembang.",
    "Rasa gurih utama",
  ],
  [
    "Campuran Tapioka / Sagu",
    "Memberi tekstur kenyal yang menjadi ciri khas pempek.",
    "Tekstur kenyal",
  ],
  [
    "Isian Telur",
    "Telur utuh di bagian tengah membuat rasanya lebih kaya dan mengenyangkan.",
    "Isian khas",
  ],
  [
    "Cuko",
    "Saus khas Palembang dari gula aren, cabai, dan asam jawa.",
    "Saus khas Palembang",
  ],
  [
    "Pelengkap",
    "Timun segar dan mie kuning menyeimbangkan rasa gurih pempek.",
    "Pelengkap sajian",
  ],
];

function Reveal({
  children,
  id,
  className = "section reveal",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  useEffect(() => {
    const element = document.getElementById(id ?? "");
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
}

function SectionTitle({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-title">
      <span className="badge">{badge}</span>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function Hero() {
  const copy = useSiteCopy();
  const words = copy("hero.typingWords")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setWordIndex((index) => (index + 1) % Math.max(words.length, 1)),
      2600,
    );
    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <>
      <section className="hero">
        <div className="hero-bg">
          <img src="/image/ampera.png" alt="Jembatan Ampera Palembang" />
          <div className="hero-overlay" />
        </div>
        <div className="hero-ornament hero-ornament-1" />
        <div className="hero-ornament hero-ornament-2" />
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-eyebrow">{copy("hero.eyebrow")}</span>
            <h1>
              {copy("hero.titlePrefix")}{" "}
              <em className="typing-text done">
                {words[wordIndex] ?? "Wong Kito"}
              </em>
              <span className="typing-cursor">|</span>
              {copy("hero.titleSuffix")}
            </h1>
            <p>{copy("hero.desc")}</p>
            <div className="hero-buttons">
              <a href="#menu" className="btn btn-solid">
                {copy("hero.btnMenu")}
              </a>
              <a href="#anatomi" className="btn btn-outline">
                {copy("hero.btnAnatomi")}
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <h3>{copy("hero.stat1Value")}</h3>
                <p>{copy("hero.stat1Label")}</p>
              </div>
              <div>
                <h3>{copy("hero.stat2Value")}</h3>
                <p>{copy("hero.stat2Label")}</p>
              </div>
              <div>
                <h3>{copy("hero.stat3Value")}</h3>
                <p>{copy("hero.stat3Label")}</p>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/image/Pempek_palembang.jpg"
              alt="Pempek Wong Kito"
              className="hero-photo"
            />
          </div>
        </div>
      </section>
      <Reveal id="cerita" className="section section-cerita reveal">
        <div className="container">
          <SectionTitle
            badge={copy("cerita.badge")}
            title={copy("cerita.title")}
          />
          <div className="cerita-grid">
            <div className="cerita-visual">
              <div className="cerita-frame">
                <img
                  src="/image/ampera.png"
                  alt="Jembatan Ampera"
                  className="cerita-img-main"
                />
              </div>
              <div className="cerita-journey">
                <span>{copy("cerita.journeyFrom")}</span>
                <span className="cerita-line" />
                <span>{copy("cerita.journeyTo")}</span>
              </div>
            </div>
            <div className="cerita-text">
              <p className="cerita-lead">{copy("cerita.lead")}</p>
              <p>{copy("cerita.p1")}</p>
              <p>{copy("cerita.p2")}</p>
              <div className="cerita-sign">
                <span className="cerita-sign-line" />
                <span>
                  {copy("cerita.signGreeting")}
                  <br />
                  <strong>{copy("cerita.signName")}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}

export function StorefrontSections({
  onAddItem,
}: {
  onAddItem: (id: number) => void;
}) {
  const copy = useSiteCopy();
  const { menu, ready } = useStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const features = [
    ["🐟", copy("keunggulan.card1Title"), copy("keunggulan.card1Desc")],
    ["🥣", copy("keunggulan.card2Title"), copy("keunggulan.card2Desc")],
    ["👨‍🍳", copy("keunggulan.card3Title"), copy("keunggulan.card3Desc")],
  ];
  const testimonials = [1, 2, 3].map((index) => ({
    text: copy(`testimoni.t${index}Text`),
    name: copy(`testimoni.t${index}Name`),
    city: copy(`testimoni.t${index}City`),
  }));
  const faqs = [1, 2, 3, 4, 5].map((index) => ({
    question: copy(`faq.q${index}`),
    answer: copy(`faq.a${index}`),
  }));

  return (
    <>
      <Reveal id="keunggulan" className="section bg-white reveal">
        <div className="container">
          <SectionTitle
            badge={copy("keunggulan.badge")}
            title={copy("keunggulan.title")}
            subtitle={copy("keunggulan.subtitle")}
          />
          <div className="keunggulan-grid">
            {features.map(([icon, title, desc]) => (
              <article className="keunggulan-card" key={title}>
                <div className="keunggulan-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal id="favorit">
        <div className="container">
          <SectionTitle
            badge={copy("favorit.badge")}
            title={copy("favorit.title")}
            subtitle={copy("favorit.subtitle")}
          />
          <div className="favorit-card">
            <div className="favorit-img">
              <img
                src="/image/Pempek_palembang.jpg"
                alt={copy("favorit.name")}
              />
              <span className="favorit-tag">{copy("favorit.tag")}</span>
            </div>
            <div className="favorit-info">
              <h3>{copy("favorit.name")}</h3>
              <div className="favorit-stars">★★★★★</div>
              <p className="favorit-desc">{copy("favorit.desc")}</p>
              <div className="favorit-price">{copy("favorit.price")}</div>
              <button
                className="btn-order-fav"
                onClick={() =>
                  onAddItem(
                    menu.find((item) => item.id === 1)?.id ?? menu[0]?.id ?? 1,
                  )
                }
              >
                {copy("favorit.button")}
              </button>
            </div>
          </div>
        </div>
      </Reveal>
      <Reveal id="menu" className="section bg-white reveal">
        <div className="container">
          <SectionTitle
            badge={copy("menu.badge")}
            title={copy("menu.title")}
            subtitle={copy("menu.subtitle")}
          />
          <div className="menu-grid">
            {ready && menu.length ? (
              menu.map((item) => (
                <article className="menu-card" key={item.id}>
                  <img
                    src={item.img}
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.src = "/image/Pempek_palembang.jpg";
                    }}
                  />
                  <div className="menu-card-body">
                    <h3>{item.name}</h3>
                    {item.desc && <p>{item.desc}</p>}
                    <div className="menu-price">
                      Rp {item.price.toLocaleString("id-ID")}
                    </div>
                    <button
                      className="btn-order"
                      onClick={() => onAddItem(item.id)}
                    >
                      Pesan
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-menu">Memuat menu...</p>
            )}
          </div>
        </div>
      </Reveal>
      <Reveal id="anatomi" className="section reveal">
        <div className="container">
          <SectionTitle
            badge="Kenali Produk"
            title="Anatomi Pempek Kapal Selam"
            subtitle="Pilih lapisan untuk mengenal bahan dan teksturnya."
          />
          <div className="anatomy-react">
            <div className="anatomy-plate">
              <img
                src="/image/Pempek_palembang.jpg"
                alt="Potongan pempek kapal selam"
              />
              <span className="anatomy-number">
                {activeLayer === null ? "✦" : activeLayer + 1}
              </span>
            </div>
            <div className="anatomy-detail">
              <div className="anatomy-tabs">
                {anatomy.map(([title], index) => (
                  <button
                    key={title}
                    className={`anatomi-tab ${activeLayer === index ? "active" : ""}`}
                    onClick={() =>
                      setActiveLayer(activeLayer === index ? null : index)
                    }
                  >
                    {index + 1}. {title}
                  </button>
                ))}
              </div>
              {activeLayer === null ? (
                <div className="anatomy-copy">
                  <h3>Enam bagian, satu rasa khas</h3>
                  <p>
                    Pempek diracik dari ikan pilihan, tekstur kenyal, dan cuko
                    yang seimbang.
                  </p>
                </div>
              ) : (
                <div className="anatomy-copy">
                  <h3>{anatomy[activeLayer][0]}</h3>
                  <p>{anatomy[activeLayer][1]}</p>
                  <strong>{anatomy[activeLayer][2]}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>
      <Reveal id="testimoni">
        <div className="container">
          <SectionTitle
            badge={copy("testimoni.badge")}
            title={copy("testimoni.title")}
          />
          <div className="testimoni-grid">
            {testimonials.map((item) => (
              <article className="testimoni-card" key={item.name}>
                <div className="testimoni-stars">★★★★★</div>
                <p className="testimoni-text">{item.text}</p>
                <div className="testimoni-user">
                  <span className="testimoni-avatar">
                    {item.name.charAt(0)}
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.city}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal id="galeri" className="section bg-white reveal">
        <div className="container">
          <SectionTitle
            badge={copy("galeri.badge")}
            title={copy("galeri.title")}
            subtitle={copy("galeri.subtitle")}
          />
          <div className="galeri-grid">
            <div className="galeri-item galeri-big">
              <img src="/image/Pempek_palembang.jpg" alt="Pempek Palembang" />
            </div>
            {[
              ["kapal-Selam.jpg", "Pempek Kapal Selam"],
              ["pempek-lenjer.jpg", "Pempek Lenjer"],
              ["Tekwan.jpg", "Tekwan"],
              ["logo.png", "Logo Wong Kito"],
            ].map(([src, alt], index) => (
              <div
                className={`galeri-item ${index === 3 ? "galeri-wide" : ""}`}
                key={src}
              >
                <img
                  src={`/image/${src}`}
                  alt={alt}
                  onError={(event) => {
                    event.currentTarget.src = "/image/Pempek_palembang.jpg";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal id="lokasi">
        <div className="container">
          <SectionTitle
            badge={copy("lokasi.badge")}
            title={copy("lokasi.title")}
            subtitle={copy("lokasi.subtitle")}
          />
          <div className="lokasi-grid">
            <div className="lokasi-info">
              <div className="lokasi-item">
                <span className="lokasi-icon">📍</span>
                <div>
                  <strong>Alamat</strong>
                  <p>
                    {copy("lokasi.address")
                      .split("\n")
                      .map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                  </p>
                </div>
              </div>
              <div className="lokasi-item">
                <span className="lokasi-icon">🕘</span>
                <div>
                  <strong>Jam Buka</strong>
                  <p>
                    {copy("lokasi.hours")
                      .split("\n")
                      .map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                  </p>
                </div>
              </div>
              <div className="lokasi-item">
                <span className="lokasi-icon">📞</span>
                <div>
                  <strong>Telepon / WhatsApp</strong>
                  <p>
                    {copy("lokasi.phone")
                      .split("\n")
                      .map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                  </p>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Jembatan+Ampera+Palembang"
                target="_blank"
                rel="noreferrer"
                className="btn-maps"
              >
                🗺️ Buka Google Maps
              </a>
            </div>
            <div className="lokasi-map">
              <iframe
                title="Peta Jembatan Ampera"
                src="https://www.google.com/maps?q=Jembatan+Ampera+Palembang&output=embed"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Reveal>
      <Reveal id="faq" className="section bg-white reveal">
        <div className="container">
          <SectionTitle badge={copy("faq.badge")} title={copy("faq.title")} />
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                className={`faq-item ${activeFaq === index ? "active" : ""}`}
                key={faq.question}
              >
                <button
                  className="faq-question"
                  aria-expanded={activeFaq === index}
                  onClick={() =>
                    setActiveFaq(activeFaq === index ? null : index)
                  }
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">
                    {activeFaq === index ? "−" : "+"}
                  </span>
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <footer>
        <div className="footer-songket" />
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="logo footer-logo">
              <img
                src="/image/logo.png"
                alt="Logo Pempek Wong Kito"
                className="logo-img"
              />
              <span className="logo-text">Pempek Wong Kito</span>
            </div>
            <p className="footer-tagline">{copy("footer.tagline")}</p>
          </div>
          <p className="footer-copy">{copy("footer.copy")}</p>
        </div>
        <div className="footer-songket" />
      </footer>
    </>
  );
}

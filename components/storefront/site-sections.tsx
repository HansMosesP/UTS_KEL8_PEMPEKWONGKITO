"use client";

import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  CookingPot,
  Fish,
  Layers,
  MousePointerClick,
  Quote,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import { DEFAULT_IMAGES, defaultFeatureImg } from "../../lib/defaults";
import { useStore } from "../../lib/store";
import { useSiteCopy } from "../shared/use-site-copy";

/** Jika gambar hasil upload gagal dimuat, pakai gambar bawaan. */
const fallbackTo = (src: string) => (event: SyntheticEvent<HTMLImageElement>) => {
  if (!event.currentTarget.src.endsWith(src)) event.currentTarget.src = src;
};

/** Foto pertama besar; foto terakhir dilebarkan agar baris bawah galeri tidak bolong. */
function galleryClass(index: number, total: number) {
  if (total < 3) return "";
  if (index === 0) return "galeri-big";
  const rest = (total - 3) % 3;
  if (index === total - 1 && total > 3 && rest === 2) return "galeri-wide";
  if (index === total - 1 && total > 3 && rest === 1) return "galeri-full";
  return "";
}

function Reveal({
  children,
  id,
  className = "section reveal",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      element.classList.add("visible");
      return;
    }
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
  }, []);
  return (
    <section id={id} className={className} ref={ref}>
      {children}
    </section>
  );
}

function SectionTitle({ badge, title, subtitle }: { badge: string; title: string; subtitle?: string }) {
  return (
    <div className="section-title">
      <span className="badge">{badge}</span>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <span key={index}>
          {line}
          <br />
        </span>
      ))}
    </>
  );
}

function Hero() {
  const copy = useSiteCopy();
  const { images } = useStore();
  const words = copy("hero.typingWords")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    setWordIndex(0);
    const timer = window.setInterval(
      () => setWordIndex((index) => (index + 1) % Math.max(words.length, 1)),
      2600,
    );
    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <section className="hero" id="beranda">
      <div className="hero-bg">
        <img src={images.heroBg} alt="" onError={fallbackTo(DEFAULT_IMAGES.heroBg)} />
        <div className="hero-overlay" />
      </div>
      <div className="hero-ornament hero-ornament-1" />
      <div className="hero-ornament hero-ornament-2" />
      <div className="container hero-content">
        <div className="hero-text">
          <span className="hero-eyebrow">{copy("hero.eyebrow")}</span>
          <h1>
            {copy("hero.titlePrefix")}{" "}
            <em className="typing-text done">{words[wordIndex] ?? "Wong Kito"}</em>
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
            {[1, 2, 3].map((index) => (
              <div key={index}>
                <h3>{copy(`hero.stat${index}Value`)}</h3>
                <p>{copy(`hero.stat${index}Label`)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-image">
          <img
            src={images.heroPhoto}
            alt="Pempek Wong Kito"
            className="hero-photo"
            onError={fallbackTo(DEFAULT_IMAGES.heroPhoto)}
          />
        </div>
      </div>
    </section>
  );
}

export function StorefrontSections({ onAddItem }: { onAddItem: (id: number) => void }) {
  const copy = useSiteCopy();
  const { menu, ready, faqs, testimonials, settings, anatomy, features, gallery, images } = useStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  // Bisa undefined bila admin menghapus lapisan yang sedang dipilih.
  const layer = activeLayer === null ? undefined : anatomy[activeLayer];
  const layerNo = layer && activeLayer !== null ? activeLayer + 1 : null;
  // Tombol panah: maju/mundur memutar; dari keadaan awal mulai di bagian pertama/terakhir.
  const stepLayer = (direction: 1 | -1) => {
    const total = anatomy.length;
    if (!total) return;
    setActiveLayer((current) =>
      current === null || current >= total
        ? direction === 1 ? 0 : total - 1
        : (current + direction + total) % total,
    );
  };
  // Tombol favorit memesan menu yang namanya sama dengan teks "Favorit — Nama menu".
  const favoriteName = copy("favorit.name").trim().toLowerCase();
  const favoriteItem =
    menu.find((item) => item.name.trim().toLowerCase() === favoriteName) ?? menu[0];
  const whatsappUrl = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Halo Pempek Wong Kito, saya mau tanya/pesan.")}`
    : "";

  return (
    <>
      <Hero />

      <Reveal id="favorit">
        <div className="container">
          <SectionTitle badge={copy("favorit.badge")} title={copy("favorit.title")} subtitle={copy("favorit.subtitle")} />
          <div className="favorit-card">
            <div className="favorit-img">
              <img src={favoriteItem?.img ?? "/image/Pempek_palembang.jpg"} alt={copy("favorit.name")} />
              <span className="favorit-tag">{copy("favorit.tag")}</span>
            </div>
            <div className="favorit-info">
              <h3>{copy("favorit.name")}</h3>
              <div className="favorit-stars">★★★★★</div>
              <p className="favorit-desc">{copy("favorit.desc")}</p>
              <div className="favorit-price">{copy("favorit.price")}</div>
              <button
                className="btn-order-fav"
                disabled={!ready || !favoriteItem}
                onClick={() => favoriteItem && onAddItem(favoriteItem.id)}
              >
                {copy("favorit.button")}
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal id="menu" className="section bg-white reveal">
        <div className="container">
          <SectionTitle badge={copy("menu.badge")} title={copy("menu.title")} subtitle={copy("menu.subtitle")} />
          <div className="menu-grid">
            {!ready ? (
              <p className="empty-menu">Memuat menu...</p>
            ) : menu.length ? (
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
                    <div className="menu-price">Rp {item.price.toLocaleString("id-ID")}</div>
                    <button className="btn-order" onClick={() => onAddItem(item.id)}>
                      Pesan
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-menu">Menu belum tersedia.</p>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal id="anatomi" className="section section-anatomi reveal">
        <div className="container">
          <SectionTitle badge={copy("anatomi.badge")} title={copy("anatomi.title")} subtitle={copy("anatomi.subtitle")} />
          <div className="anatomy-react">
            <div className="anatomy-plate">
              <img
                src={images.anatomyImg}
                alt="Potongan pempek kapal selam"
                onError={fallbackTo(DEFAULT_IMAGES.anatomyImg)}
              />
              <span className="anatomy-number">{layerNo ?? <Sparkles size={18} />}</span>
              <div className="anatomy-caption">
                <small>{layerNo ? `Bagian ${layerNo} dari ${anatomy.length}` : copy("anatomi.badge")}</small>
                <strong>{layer ? layer.title : `${anatomy.length} bagian dalam satu porsi`}</strong>
              </div>
            </div>
            <div className="anatomy-detail">
              <div className="anatomy-tabs">
                {anatomy.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`anatomy-tab ${activeLayer === index ? "active" : ""}`}
                    aria-pressed={activeLayer === index}
                    onClick={() => setActiveLayer(activeLayer === index ? null : index)}
                  >
                    <span className="anatomy-tab-num">{index + 1}</span>
                    <span className="anatomy-tab-text">
                      <strong>{item.title}</strong>
                      {item.tag && <small>{item.tag}</small>}
                    </span>
                  </button>
                ))}
              </div>
              <div className="anatomy-copy" aria-live="polite">
                {layer && layerNo ? (
                  <div key={layer.id} className="anatomy-copy-body">
                    <span className="anatomy-copy-watermark" aria-hidden="true">
                      {String(layerNo).padStart(2, "0")}
                    </span>
                    <span className="anatomy-copy-eyebrow">
                      Bagian {layerNo} dari {anatomy.length}
                    </span>
                    <h3>{layer.title}</h3>
                    <p>{layer.desc}</p>
                    {layer.tag && (
                      <span className="anatomy-copy-tag">
                        <Tag size={14} /> {layer.tag}
                      </span>
                    )}
                  </div>
                ) : (
                  <div key="intro" className="anatomy-copy-body">
                    <span className="anatomy-copy-watermark" aria-hidden="true">
                      <Layers size={76} strokeWidth={1.4} />
                    </span>
                    <span className="anatomy-copy-eyebrow">{anatomy.length} bagian</span>
                    <h3>{copy("anatomi.introTitle")}</h3>
                    <p>{copy("anatomi.introDesc")}</p>
                    <span className="anatomy-copy-hint">
                      <MousePointerClick size={16} /> {copy("anatomi.hint")}
                    </span>
                  </div>
                )}
                {anatomy.length > 1 && (
                  <div className="anatomy-nav">
                    <button type="button" aria-label="Bagian sebelumnya" onClick={() => stepLayer(-1)}>
                      <ChevronLeft size={18} />
                    </button>
                    <div className="anatomy-dots">
                      {anatomy.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={`Lihat ${item.title}`}
                          className={activeLayer === index ? "active" : ""}
                          onClick={() => setActiveLayer(index)}
                        />
                      ))}
                    </div>
                    <button type="button" aria-label="Bagian berikutnya" onClick={() => stepLayer(1)}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal id="cerita" className="section section-cerita reveal">
        <div className="container">
          <SectionTitle badge={copy("cerita.badge")} title={copy("cerita.title")} />
          <div className="cerita-grid">
            <div className="cerita-visual">
              <div className="cerita-photo">
                <div className="cerita-frame">
                  <img
                    src={images.ceritaImg}
                    alt="Cerita Pempek Wong Kito"
                    className="cerita-img-main"
                    onError={fallbackTo(DEFAULT_IMAGES.ceritaImg)}
                  />
                </div>
                <div className="cerita-seal">
                  <span className="cerita-seal-icon">
                    <Award size={20} />
                  </span>
                  <strong>{copy("hero.stat3Value")}</strong>
                  <small>{copy("hero.stat3Label")}</small>
                </div>
              </div>
              <div className="cerita-journey">
                <span className="cerita-journey-stop">
                  <Waves size={16} /> {copy("cerita.journeyFrom")}
                </span>
                <span className="cerita-line" aria-hidden="true" />
                <span className="cerita-journey-stop is-end">
                  <UtensilsCrossed size={16} /> {copy("cerita.journeyTo")}
                </span>
              </div>
            </div>
            <div className="cerita-text">
              <blockquote className="cerita-lead">
                <span className="cerita-quote-mark" aria-hidden="true">
                  <Quote size={18} />
                </span>
                <p>{copy("cerita.lead")}</p>
              </blockquote>
              <div className="cerita-points">
                <div className="cerita-point">
                  <span className="cerita-point-icon">
                    <Fish size={22} />
                  </span>
                  <div>
                    <h4>{copy("cerita.p1Title")}</h4>
                    <p>{copy("cerita.p1")}</p>
                  </div>
                </div>
                <div className="cerita-point">
                  <span className="cerita-point-icon">
                    <CookingPot size={22} />
                  </span>
                  <div>
                    <h4>{copy("cerita.p2Title")}</h4>
                    <p>{copy("cerita.p2")}</p>
                  </div>
                </div>
              </div>
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

      <Reveal id="keunggulan" className="section bg-white reveal">
        <div className="container">
          <SectionTitle badge={copy("keunggulan.badge")} title={copy("keunggulan.title")} subtitle={copy("keunggulan.subtitle")} />
          <div className="keunggulan-grid">
            {features.map((item, index) => (
              <article className="keunggulan-card" key={item.id}>
                <div className="keunggulan-photo">
                  <img
                    src={item.img || defaultFeatureImg(index)}
                    alt={item.title}
                    loading="lazy"
                    onError={fallbackTo(defaultFeatureImg(index))}
                  />
                </div>
                <div className="keunggulan-body">
                  <span className="keunggulan-num">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal id="testimoni">
        <div className="container">
          <SectionTitle badge={copy("testimoni.badge")} title={copy("testimoni.title")} />
          <div className="testimoni-grid">
            {testimonials.map((item) => (
              <article className="testimoni-card" key={item.id}>
                <div className="testimoni-stars" aria-label={`${item.rating} dari 5 bintang`}>
                  {"★".repeat(item.rating) + "☆".repeat(5 - item.rating)}
                </div>
                <p className="testimoni-text">{item.text}</p>
                <div className="testimoni-user">
                  <span className="testimoni-avatar">{item.name.charAt(0).toUpperCase()}</span>
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

      {gallery.length > 0 && (
        <Reveal id="galeri" className="section bg-white reveal">
          <div className="container">
            <SectionTitle badge={copy("galeri.badge")} title={copy("galeri.title")} subtitle={copy("galeri.subtitle")} />
            <div
              className="galeri-grid"
              // 1–2 foto: kolom menyesuaikan jumlah foto agar tidak ada kolom kosong.
              style={gallery.length < 3 ? { gridTemplateColumns: `repeat(${gallery.length}, 1fr)` } : undefined}
            >
              {gallery.map((item, index) => (
                <div className={`galeri-item ${galleryClass(index, gallery.length)}`} key={item.id}>
                  <img
                    src={item.img}
                    alt={item.caption}
                    loading="lazy"
                    onError={fallbackTo("/image/Pempek_palembang.jpg")}
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal id="faq" className="section reveal">
        <div className="container">
          <SectionTitle badge={copy("faq.badge")} title={copy("faq.title")} />
          <div className="faq-list">
            {faqs.length ? (
              faqs.map((faq, index) => (
                <div className={`faq-item ${activeFaq === faq.id ? "active" : ""}`} key={faq.id}>
                  <button
                    className="faq-question"
                    aria-expanded={activeFaq === faq.id}
                    aria-controls={`faq-answer-${faq.id}`}
                    onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                  >
                    <span>
                      {index + 1}. {faq.question}
                    </span>
                    <span className="faq-icon">{activeFaq === faq.id ? "−" : "+"}</span>
                  </button>
                  <div className="faq-answer" id={`faq-answer-${faq.id}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-menu">Belum ada pertanyaan.</p>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal id="lokasi" className="section bg-white reveal">
        <div className="container">
          <SectionTitle badge={copy("lokasi.badge")} title={copy("lokasi.title")} subtitle={copy("lokasi.subtitle")} />
          <div className="lokasi-grid">
            <div className="lokasi-info">
              <div className="lokasi-item">
                <span className="lokasi-icon">📍</span>
                <div>
                  <strong>Alamat</strong>
                  <p>
                    <Lines text={copy("lokasi.address")} />
                  </p>
                </div>
              </div>
              <div className="lokasi-item">
                <span className="lokasi-icon">🕘</span>
                <div>
                  <strong>Jam Buka</strong>
                  <p>
                    <Lines text={copy("lokasi.hours")} />
                  </p>
                </div>
              </div>
              <div className="lokasi-item">
                <span className="lokasi-icon">📞</span>
                <div>
                  <strong>Telepon / WhatsApp</strong>
                  <p>
                    <Lines text={copy("lokasi.phone")} />
                  </p>
                </div>
              </div>
              <div className="lokasi-actions">
                <a href={settings.mapLinkUrl} target="_blank" rel="noreferrer" className="btn-maps">
                  🗺️ Buka Google Maps
                </a>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-maps btn-wa">
                    💬 Chat WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div className="lokasi-map">
              <iframe
                title="Peta lokasi Pempek Wong Kito"
                src={settings.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </Reveal>

      <footer>
        <div className="footer-songket" />
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="logo footer-logo">
              <img src="/image/logo.png" alt="Logo Pempek Wong Kito" className="logo-img" />
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

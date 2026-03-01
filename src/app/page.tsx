"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import styles from "./page.module.css";

// ---- Animated Counter Hook ----
function useCounter(target: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

// ---- Typing Effect Component ----
function TypingText({ texts, speed = 80, pause = 2000 }: { texts: string[]; speed?: number; pause?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && charIndex < current.length) {
      timeout = setTimeout(() => setCharIndex(charIndex + 1), speed);
    } else if (!isDeleting && charIndex === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex(charIndex - 1), speed / 2);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((textIndex + 1) % texts.length);
    }

    setDisplayText(current.substring(0, charIndex));
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed, pause]);

  return (
    <span className={styles.typingText}>
      {displayText}
      <span className={styles.cursor}>|</span>
    </span>
  );
}

// ---- Floating Particles Component ----
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ["#cc36d6", "#e44af0", "#f472ff", "#f0c040", "#36d680"];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "#cc36d6";
            ctx.globalAlpha = 0.03 * (1 - dist / 150);
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const cleanup = animate();
    return cleanup;
  }, [animate]);

  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
}

// ---- Live Status Indicator ----
function LiveDot() {
  return (
    <span className={styles.liveDot}>
      <span className={styles.liveDotInner} />
      <span className={styles.liveDotPulse} />
    </span>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const stats1 = useCounter(2847, 2500);
  const stats2 = useCounter(156, 2000);
  const stats3 = useCounter(99, 1800);

  return (
    <div className={styles.page}>
      {/* Live particles background */}
      <Particles />

      {/* Animated accent line (left side) */}
      <div className={styles.accentLine} />

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#cc36d6" />
                    <stop offset="100%" stopColor="#f472ff" />
                  </linearGradient>
                </defs>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className={styles.logoText}>
              AI <span className="gradient-text">PYP</span>
            </span>
          </div>
          <div className={styles.navRight}>
            <div className={styles.liveIndicator}>
              <LiveDot /> <span>System Online</span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => router.push("/generate")}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroBadge}>
            <span className="badge">
              <LiveDot />
              AI-Powered Exam Generator
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            Generate Your <br />
            <TypingText
              texts={[
                "Final Exam Paper",
                "Practice Questions",
                "Mock Test Paper",
                "Study Material",
              ]}
              speed={90}
              pause={2500}
            />
            <br />
            <span className={styles.heroSubline}>in Minutes</span>
          </h1>

          <p className={styles.heroDesc}>
            Upload your lecture notes and past year papers — our AI analyzes the
            format, topics, and difficulty to create a brand new practice exam
            that feels like the real thing.
          </p>

          <div className={styles.heroCta}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => router.push("/generate")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Start Generating
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}>
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statCard} ref={stats1.ref}>
              <div className={styles.statNumber}>
                <span className="gradient-text">{stats1.count.toLocaleString()}</span>
                <span className={styles.statPlus}>+</span>
              </div>
              <div className={styles.statLabel}>Papers Generated</div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: "85%" }} />
              </div>
            </div>
            <div className={styles.statCard} ref={stats2.ref}>
              <div className={styles.statNumber}>
                <span className="gradient-text">{stats2.count}</span>
                <span className={styles.statPlus}>+</span>
              </div>
              <div className={styles.statLabel}>Universities</div>
              <div className={styles.statBar}>
                <div className={`${styles.statBarFill} ${styles.statBarYellow}`} style={{ width: "65%" }} />
              </div>
            </div>
            <div className={styles.statCard} ref={stats3.ref}>
              <div className={styles.statNumber}>
                <span className="gradient-text">{stats3.count}%</span>
              </div>
              <div className={styles.statLabel}>Format Match Rate</div>
              <div className={styles.statBar}>
                <div className={`${styles.statBarFill} ${styles.statBarGreen}`} style={{ width: "99%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.steps}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className={styles.sectionDesc}>
            Three simple steps to a professional exam paper
          </p>

          <div className={styles.stepsGrid}>
            {[
              {
                step: "01",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                ),
                title: "Upload Sources",
                desc: "Upload your lecture notes, slides, or textbook PDFs — the material your exam should be based on.",
                status: "READY",
                statusColor: "green",
              },
              {
                step: "02",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
                title: "Add Past Year Paper",
                desc: "Upload a past year paper so the AI can match the exact format, style, and difficulty level.",
                status: "ANALYZING",
                statusColor: "yellow",
              },
              {
                step: "03",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
                title: "Generate & Download",
                desc: "AI generates a brand new exam paper. Preview, edit, and export as PDF — ready to practice.",
                status: "GENERATING",
                statusColor: "magenta",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={styles.stepCard}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className={styles.stepNumber}>{item.step}</div>
                <div className={styles.stepIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <div className={`${styles.stepStatus} ${styles[`status_${item.statusColor}`]}`}>
                  <LiveDot /> {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Why <span className="gradient-text">AI PYP</span>?
          </h2>

          <div className={styles.featuresGrid}>
            {[
              { icon: "🎯", title: "Format Matching", desc: "AI analyzes your PYP structure — sections, question types, marks — and replicates it exactly." },
              { icon: "📚", title: "Source-Based Only", desc: "Questions are generated strictly from your uploaded material. No random hallucinations." },
              { icon: "⚡", title: "Instant Generation", desc: "Get a complete exam paper in under 60 seconds. Regenerate individual questions if needed." },
              { icon: "📄", title: "PDF Export", desc: "Download your paper in professional PDF format, ready for printing or digital practice." },
              { icon: "🔒", title: "Privacy First", desc: "Your files are processed on-demand and never stored permanently. Your data stays yours." },
              { icon: "✏️", title: "Edit & Customize", desc: "Preview the generated paper, edit any question, adjust difficulty, or add answer keys." },
            ].map((feat, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaCard}>
            <h2>
              Ready to Generate Your <span className="gradient-text">Exam Paper</span>?
            </h2>
            <p>
              Upload your notes and past papers — let AI do the rest.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => router.push("/generate")}
            >
              Start Now — It&apos;s Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p>
            Built with ❤️ for university students everywhere. AI PYP © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

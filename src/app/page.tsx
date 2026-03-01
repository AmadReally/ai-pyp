"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      {/* Floating orbs */}
      <div className={styles.orbContainer}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>

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
                    <stop offset="0%" stopColor="#6c5ce7" />
                    <stop offset="100%" stopColor="#00cec9" />
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
          <button
            className="btn btn-primary btn-sm"
            onClick={() => router.push("/generate")}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroBadge}>
            <span className="badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              AI-Powered Exam Generator
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            Generate Your <br />
            <span className="gradient-text">Final Exam Paper</span>
            <br />
            in Minutes
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`glass-card ${styles.stepCard}`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className={styles.stepNumber}>{item.step}</div>
                <div className={styles.stepIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
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
              {
                icon: "🎯",
                title: "Format Matching",
                desc: "AI analyzes your PYP structure — sections, question types, marks — and replicates it exactly.",
              },
              {
                icon: "📚",
                title: "Source-Based Only",
                desc: "Questions are generated strictly from your uploaded material. No random hallucinations.",
              },
              {
                icon: "⚡",
                title: "Instant Generation",
                desc: "Get a complete exam paper in under 60 seconds. Regenerate individual questions if needed.",
              },
              {
                icon: "📄",
                title: "PDF Export",
                desc: "Download your paper in professional PDF format, ready for printing or digital practice.",
              },
              {
                icon: "🔒",
                title: "Privacy First",
                desc: "Your files are processed on-demand and never stored permanently. Your data stays yours.",
              },
              {
                icon: "✏️",
                title: "Edit & Customize",
                desc: "Preview the generated paper, edit any question, adjust difficulty, or add answer keys.",
              },
            ].map((feat, i) => (
              <div key={i} className={`glass-card ${styles.featureCard}`}>
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
          <div className={`glass-card ${styles.ctaCard}`}>
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

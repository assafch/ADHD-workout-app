// Three Home screen directions
// All RTL Hebrew first; tweak toggles LTR English.
// Direction A: Giant day name as identity (PUSH/PULL/LEGS)
// Direction B: Streak as hero (week dots + CTA sticky bottom)
// Direction C: Card-of-the-day with CTA inside

const COPY = {
  he: {
    greet: "בוקר טוב, יואב",
    today: "היום",
    push: "דחיפה",
    pull: "משיכה",
    legs: "רגליים",
    rest: "מנוחה",
    start: "התחל אימון",
    resume: "המשך",
    week: "השבוע",
    streak: "ימים ברצף",
    weight: "משקל גוף",
    log: "תיעוד מהיר",
    preview: "תרגילים היום",
    adjust: "התאם",
    bad: "יום קשה?",
    badSub: "סט אחד נחשב",
    kg: "ק״ג",
    sets: "סטים",
    days: ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"],
    exercises: ["לחיצת חזה", "לחיצת כתפיים", "טריצפס מעל הראש", "פרפר"],
  },
  en: {
    greet: "Good morning, Yoav",
    today: "Today",
    push: "Push",
    pull: "Pull",
    legs: "Legs",
    rest: "Rest",
    start: "Start workout",
    resume: "Resume",
    week: "This week",
    streak: "day streak",
    weight: "Body weight",
    log: "Quick log",
    preview: "Today's lifts",
    adjust: "Adjust",
    bad: "Rough day?",
    badSub: "One set counts",
    kg: "kg",
    sets: "sets",
    days: ["S","M","T","W","T","F","S"],
    exercises: ["Bench press", "Overhead press", "Tricep extension", "Chest fly"],
  },
};

// ─── Direction A: Day-name as identity ───────────────────────────────────
const HomeA = ({ lang = "he" }) => {
  const t = COPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  return (
    <PhoneFrame dir={dir} label={`A · ${lang === "he" ? "שם היום כזהות" : "Day-name identity"}`}
      note={lang === "he" ? "שם היום הוא הזהות הויזואלית. החלטה אחת: התחל." : "Day name IS the identity. One decision: start."}>
      <StatusBar />
      <div style={{ padding: "8px 22px 0", textAlign: align }}>
        <div style={{ fontSize: 13, color: "#8a8378", letterSpacing: 0.5 }}>{t.greet}</div>
      </div>

      {/* Massive day name */}
      <div style={{
        padding: "28px 22px 8px",
        textAlign: align,
      }}>
        <div style={{ fontSize: 11, color: "#a8421f", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
          {t.today.toUpperCase()} · יום 12
        </div>
        <div style={{
          fontSize: 78,
          fontWeight: 900,
          lineHeight: 0.88,
          color: "#f5f1ea",
          letterSpacing: lang === "he" ? -1 : -3,
        }}>{t.push}</div>
        <div style={{ fontSize: 13, color: "#5a5550", marginTop: 10, fontFamily: "'JetBrains Mono', monospace" }}>
          4 {t.exercises.length} · ~38 min
        </div>
      </div>

      {/* Giant CTA */}
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{
          height: 92,
          background: "#d97047",
          borderRadius: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1c1b1a",
          fontSize: 24,
          fontWeight: 800,
          boxShadow: "0 0 0 6px rgba(217,112,71,0.15)",
          position: "relative",
        }}>
          {t.start}
          <SketchNote style={{ position: "absolute", top: -8, [lang === "he" ? "right" : "left"]: -120, color: "#a8421f", transform: "rotate(-6deg)" }}>
            {lang === "he" ? "↙ פולס עדין" : "subtle pulse ↘"}
          </SketchNote>
        </div>
      </div>

      {/* Streak strip */}
      <div style={{ padding: "26px 22px 0", display: "flex", gap: 8, justifyContent: "space-between", direction: "ltr" }}>
        {t.days.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>{d}</div>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: i < 4 ? "#d97047" : i === 4 ? "#3a3633" : "transparent",
              border: i >= 4 ? "1.5px dashed #3a3633" : "none",
            }} />
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 22px 0", textAlign: align, fontSize: 11, color: "#8a8378", fontFamily: "'JetBrains Mono', monospace" }}>
        4 {t.streak} 🔥
      </div>

      {/* Preview list — collapsed */}
      <div style={{ padding: "22px 22px 0", textAlign: align }}>
        <div style={{ fontSize: 11, color: "#5a5550", marginBottom: 8, letterSpacing: 1 }}>{t.preview.toUpperCase()}</div>
        {t.exercises.map((ex, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: i < 3 ? "1px solid #2a2724" : "none",
            fontSize: 14,
            color: "#c9c2b6",
          }}>
            <span>{ex}</span>
            <span style={{ color: "#5a5550", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>3×8</span>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 64,
        background: "#0d0d0e",
        borderTop: "1px solid #2a2724",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        direction: "ltr",
      }}>
        {["▮", "▦", "△", "○"].map((g, i) => (
          <div key={i} style={{
            color: i === 0 ? "#f5f1ea" : "#5a5550",
            fontSize: 18,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{g}</div>
        ))}
      </div>
    </PhoneFrame>
  );
};

// ─── Direction B: Streak as hero ──────────────────────────────────────────
const HomeB = ({ lang = "he" }) => {
  const t = COPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  return (
    <PhoneFrame dir={dir} label={`B · ${lang === "he" ? "סטריק כגיבור" : "Streak as hero"}`}
      note={lang === "he" ? "המומנטום קודם — CTA נצמד לתחתית. דופמין מלמעלה." : "Momentum first — CTA sticks to bottom. Dopamine on top."}>
      <StatusBar />
      <div style={{ padding: "10px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#8a8378" }}>{t.greet}</div>
        <div style={{ fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>⚙</div>
      </div>

      {/* Streak hero */}
      <div style={{
        margin: "20px 22px 0",
        padding: "26px 20px",
        borderRadius: 28,
        background: "linear-gradient(160deg, #2a1f1a 0%, #1c1b1a 100%)",
        border: "1px solid #3a2a22",
        textAlign: "center",
        position: "relative",
      }}>
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 1,
          color: "#d97047",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: -3,
        }}>4</div>
        <div style={{ fontSize: 13, color: "#c9c2b6", marginTop: 4, letterSpacing: 1 }}>
          {t.streak.toUpperCase()}
        </div>
        {/* Week dots */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, direction: "ltr" }}>
          {t.days.map((d, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: "50%",
              background: i < 4 ? "#d97047" : "transparent",
              border: i >= 4 ? "1.5px solid #3a3633" : "none",
              boxShadow: i === 3 ? "0 0 0 4px rgba(217,112,71,0.2)" : "none",
            }} />
          ))}
        </div>
        <SketchNote style={{ position: "absolute", top: 18, [lang === "he" ? "left" : "right"]: -90, transform: "rotate(8deg)" }}>
          {lang === "he" ? "↗ הילה רכה" : "↖ soft halo"}
        </SketchNote>
      </div>

      {/* Today card */}
      <div style={{
        margin: "18px 22px 0",
        padding: "16px 18px",
        borderRadius: 20,
        background: "#252220",
        textAlign: align,
      }}>
        <div style={{ fontSize: 11, color: "#8a8378", letterSpacing: 1, marginBottom: 4 }}>
          {t.today.toUpperCase()}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#f5f1ea" }}>{t.push}</div>
        <div style={{ fontSize: 12, color: "#5a5550", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
          4 {t.exercises.length} · ~38 min
        </div>
      </div>

      {/* Quick row */}
      <div style={{ display: "flex", gap: 10, padding: "14px 22px 0" }}>
        <div style={{ flex: 1, padding: "12px 14px", border: "1.5px dashed #3a3633", borderRadius: 16, textAlign: align }}>
          <div style={{ fontSize: 10, color: "#5a5550", letterSpacing: 1 }}>{t.weight.toUpperCase()}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#c9c2b6", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            72.4 <span style={{ fontSize: 11, color: "#5a5550" }}>{t.kg}</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px 14px", border: "1.5px dashed #3a3633", borderRadius: 16, textAlign: align }}>
          <div style={{ fontSize: 10, color: "#5a5550", letterSpacing: 1 }}>{t.bad.toUpperCase()}</div>
          <div style={{ fontSize: 13, color: "#c9c2b6", marginTop: 4 }}>{t.badSub} →</div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "absolute",
        bottom: 16, left: 16, right: 16,
        height: 76,
        background: "#d97047",
        borderRadius: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#1c1b1a",
        fontSize: 22,
        fontWeight: 800,
        boxShadow: "0 8px 0 #a8421f",
        position: "absolute",
      }}>
        {t.start} →
      </div>
    </PhoneFrame>
  );
};

// ─── Direction C: Single card-of-the-day ─────────────────────────────────
const HomeC = ({ lang = "he" }) => {
  const t = COPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  return (
    <PhoneFrame dir={dir} label={`C · ${lang === "he" ? "כרטיס היום" : "One card, one decision"}`}
      note={lang === "he" ? "מסך שלם = החלטה אחת. שאר המידע מאחורי גלילה עדינה." : "Whole screen = one card = one decision. Everything else below the fold."}>
      <StatusBar />
      <div style={{ padding: "8px 22px 0", display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, color: "#8a8378" }}>{t.greet}</div>
        <div style={{
          padding: "4px 10px",
          borderRadius: 12,
          background: "rgba(217,112,71,0.12)",
          color: "#d97047",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
        }}>4 🔥</div>
      </div>

      {/* The card */}
      <div style={{
        margin: "22px 18px 0",
        padding: "26px 22px 22px",
        borderRadius: 28,
        background: "#252220",
        border: "1px solid #3a3633",
        textAlign: align,
        position: "relative",
        height: 420,
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ fontSize: 11, color: "#a8421f", letterSpacing: 2, fontWeight: 700 }}>
          {t.today.toUpperCase()} · A
        </div>
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          lineHeight: 1,
          color: "#f5f1ea",
          marginTop: 8,
          letterSpacing: lang === "he" ? -1 : -2,
        }}>{t.push}</div>

        {/* Mini exercise list */}
        <div style={{ marginTop: 22, flex: 1 }}>
          {t.exercises.map((ex, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "9px 0",
              borderBottom: i < 3 ? "1px solid #3a3633" : "none",
              fontSize: 13,
              color: "#c9c2b6",
            }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>{i+1}</span>
                {ex}
              </span>
              <span style={{ color: "#5a5550", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>3×8 · 12{t.kg}</span>
            </div>
          ))}
        </div>

        {/* CTA inside card */}
        <div style={{
          marginTop: 16,
          height: 64,
          background: "#d97047",
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1c1b1a",
          fontSize: 19,
          fontWeight: 800,
        }}>
          {t.start}
        </div>

        <SketchNote style={{ position: "absolute", top: -16, [lang === "he" ? "left" : "right"]: 16, transform: "rotate(-4deg)", background: "#1c1b1a", padding: "2px 6px", borderRadius: 6 }}>
          {lang === "he" ? "החלטה אחת ↓" : "one decision ↓"}
        </SketchNote>
      </div>

      {/* below-fold hint */}
      <div style={{ textAlign: "center", padding: "12px 0", fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>
        ↓ {lang === "he" ? "התאמות, היסטוריה" : "adjust, history"}
      </div>
    </PhoneFrame>
  );
};

Object.assign(window, { HomeA, HomeB, HomeC });

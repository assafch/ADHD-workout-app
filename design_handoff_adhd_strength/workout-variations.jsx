// Workout screen — three states (active set, resting, between exercises)
// Three different visual systems for handling those states.

const WCOPY = {
  he: {
    set: "סט",
    of: "מתוך",
    reps: "חזרות",
    weight: "משקל",
    kg: "ק״ג",
    done: "סיימתי סט",
    rest: "מנוחה",
    skip: "דלג",
    next: "הבא",
    nextEx: "תרגיל הבא",
    addSet: "+ סט נוסף",
    addEx: "+ תרגיל",
    breathe: "נשום",
    benchPress: "לחיצת חזה",
    overhead: "לחיצת כתפיים",
  },
  en: {
    set: "Set",
    of: "of",
    reps: "Reps",
    weight: "Weight",
    kg: "kg",
    done: "Set done",
    rest: "Rest",
    skip: "Skip",
    next: "Next",
    nextEx: "Next exercise",
    addSet: "+ Add set",
    addEx: "+ Add exercise",
    breathe: "Breathe",
    benchPress: "Bench press",
    overhead: "Overhead press",
  },
};

// ─── Workout System 1: Layout shift (timer takes over) ───────────────────
const WorkoutSys1 = ({ lang = "he", state = "active" }) => {
  const t = WCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";

  const stateLabel = {
    active: lang === "he" ? "פעיל" : "Active",
    rest: lang === "he" ? "מנוחה" : "Resting",
    between: lang === "he" ? "מעבר" : "Between",
  }[state];

  return (
    <PhoneFrame dir={dir} label={`Sys1 · ${stateLabel} · ${lang === "he" ? "פריסה משתנה" : "Layout shift"}`}>
      <StatusBar />
      {/* Top progress strip — always */}
      <div style={{ padding: "6px 22px 0", display: "flex", gap: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < 1 ? "#d97047" : i === 1 ? "rgba(217,112,71,0.5)" : "#2a2724",
          }} />
        ))}
      </div>
      <div style={{ padding: "10px 22px 0", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>
        <span>{t.benchPress}</span>
        <span>{lang === "he" ? "תרגיל 2/4" : "EX 2/4"}</span>
      </div>

      {state === "active" && (
        <>
          <div style={{ padding: "30px 22px 0", textAlign: align }}>
            <div style={{ fontSize: 12, color: "#8a8378", letterSpacing: 1.5 }}>
              {t.set.toUpperCase()} 2 {t.of} 3
            </div>
          </div>

          {/* Big number wheel placeholder */}
          <div style={{ padding: "20px 22px 0", display: "flex", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#5a5550", textAlign: "center", marginBottom: 6, letterSpacing: 1 }}>
                {t.weight.toUpperCase()} ({t.kg})
              </div>
              <div style={{
                height: 130,
                borderRadius: 20,
                background: "#252220",
                border: "1px solid #3a3633",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 56, fontWeight: 900, color: "#f5f1ea",
                fontFamily: "'JetBrains Mono', monospace",
                position: "relative",
              }}>
                12.5
                <div style={{ position: "absolute", top: 4, right: 8, fontSize: 9, color: "#5a5550" }}>▲</div>
                <div style={{ position: "absolute", bottom: 4, right: 8, fontSize: 9, color: "#5a5550" }}>▼</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#5a5550", textAlign: "center", marginBottom: 6, letterSpacing: 1 }}>
                {t.reps.toUpperCase()}
              </div>
              <div style={{
                height: 130,
                borderRadius: 20,
                background: "#252220",
                border: "1px solid #3a3633",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 56, fontWeight: 900, color: "#f5f1ea",
                fontFamily: "'JetBrains Mono', monospace",
              }}>8</div>
            </div>
          </div>

          {/* Done button */}
          <div style={{
            position: "absolute",
            bottom: 18, left: 16, right: 16,
            height: 88,
            background: "#d97047",
            borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#1c1b1a", fontSize: 22, fontWeight: 800,
          }}>
            {t.done} ✓
          </div>
        </>
      )}

      {state === "rest" && (
        <>
          {/* Full takeover — timer dominates */}
          <div style={{ padding: "60px 22px 0", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#8a8378", letterSpacing: 2 }}>
              {t.rest.toUpperCase()}
            </div>
            <div style={{
              fontSize: 130,
              fontWeight: 900,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#f5f1ea",
              lineHeight: 1,
              marginTop: 18,
              letterSpacing: -4,
            }}>1:24</div>
            {/* Breathing circle */}
            <div style={{
              margin: "30px auto 0",
              width: 120, height: 120,
              borderRadius: "50%",
              border: "2px solid #d97047",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 12px rgba(217,112,71,0.08), 0 0 0 28px rgba(217,112,71,0.04)",
            }}>
              <div style={{ fontSize: 14, color: "#d97047", letterSpacing: 1 }}>{t.breathe}</div>
            </div>
          </div>
          <div style={{
            position: "absolute",
            bottom: 18, left: 16, right: 16,
            height: 64, borderRadius: 18,
            border: "1.5px solid #3a3633",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#c9c2b6", fontSize: 16, fontWeight: 600,
          }}>
            {t.skip} →
          </div>
        </>
      )}

      {state === "between" && (
        <>
          <div style={{ padding: "40px 22px 0", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#a8421f", letterSpacing: 1.5, fontWeight: 700 }}>
              ✓ {t.benchPress}
            </div>
            <div style={{ marginTop: 36, fontSize: 11, color: "#5a5550", letterSpacing: 1.5 }}>
              {t.nextEx.toUpperCase()}
            </div>
            <div style={{
              fontSize: 38, fontWeight: 900, color: "#f5f1ea", marginTop: 8,
              letterSpacing: lang === "he" ? -0.5 : -1.5,
            }}>{t.overhead}</div>
            <div style={{ fontSize: 12, color: "#5a5550", marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              3 × 8 · 10{t.kg}
            </div>
          </div>
          <div style={{
            position: "absolute",
            bottom: 18, left: 16, right: 16,
            height: 88, background: "#d97047", borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#1c1b1a", fontSize: 22, fontWeight: 800,
          }}>
            {t.next} →
          </div>
        </>
      )}
    </PhoneFrame>
  );
};

// ─── Workout System 2: Color shift per state ─────────────────────────────
const WorkoutSys2 = ({ lang = "he", state = "active" }) => {
  const t = WCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  const bg = state === "active" ? "#1c1b1a" : state === "rest" ? "#1f1a26" : "#1a1f1c";
  const accent = state === "active" ? "#d97047" : state === "rest" ? "#9d7ad9" : "#7ad99d";

  const stateLabel = {
    active: lang === "he" ? "פעיל" : "Active",
    rest: lang === "he" ? "מנוחה" : "Resting",
    between: lang === "he" ? "מעבר" : "Between",
  }[state];

  return (
    <PhoneFrame dir={dir} label={`Sys2 · ${stateLabel} · ${lang === "he" ? "צבע = מצב" : "Color = state"}`}>
      <div style={{ position: "absolute", inset: 0, background: bg, transition: "background 400ms" }} />
      <div style={{ position: "relative", height: "100%" }}>
        <StatusBar />
        {/* State pill */}
        <div style={{ padding: "6px 22px 0", display: "flex", justifyContent: "center" }}>
          <div style={{
            padding: "4px 14px",
            borderRadius: 999,
            background: `${accent}22`,
            color: accent,
            fontSize: 11,
            letterSpacing: 1.5,
            fontWeight: 700,
          }}>● {stateLabel.toUpperCase()}</div>
        </div>

        <div style={{ padding: "12px 22px 0", textAlign: align }}>
          <div style={{ fontSize: 13, color: "#8a8378" }}>{t.benchPress}</div>
          <div style={{ fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
            {t.set} 2/3
          </div>
        </div>

        {state === "active" && (
          <>
            <div style={{ padding: "32px 22px 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 110, fontWeight: 900, color: "#f5f1ea", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: -4 }}>12.5</span>
                <span style={{ fontSize: 18, color: "#8a8378" }}>{t.kg}</span>
              </div>
              <div style={{ fontSize: 13, color: "#5a5550", marginTop: 8, letterSpacing: 1 }}>× 8 {t.reps}</div>
            </div>
          </>
        )}
        {state === "rest" && (
          <div style={{ padding: "44px 22px 0", textAlign: "center" }}>
            <div style={{ fontSize: 110, fontWeight: 900, color: accent, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: -4 }}>1:24</div>
            <div style={{ fontSize: 12, color: "#8a8378", marginTop: 18, letterSpacing: 1.5 }}>↓ {t.breathe.toUpperCase()} ↓</div>
          </div>
        )}
        {state === "between" && (
          <div style={{ padding: "44px 22px 0", textAlign: "center" }}>
            <div style={{ fontSize: 38, color: accent }}>✓</div>
            <div style={{ fontSize: 13, color: "#8a8378", marginTop: 18, letterSpacing: 1.5 }}>{t.next.toUpperCase()}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#f5f1ea", marginTop: 6, letterSpacing: lang === "he" ? -0.5 : -1.5 }}>{t.overhead}</div>
          </div>
        )}

        <div style={{
          position: "absolute",
          bottom: 18, left: 16, right: 16,
          height: 84, background: accent, borderRadius: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#1c1b1a", fontSize: 21, fontWeight: 800,
        }}>
          {state === "active" ? t.done : state === "rest" ? `${t.skip} →` : `${t.next} →`}
        </div>
      </div>
    </PhoneFrame>
  );
};

// ─── Workout System 3: Subtle, layout-stable, microcopy + accent ─────────
const WorkoutSys3 = ({ lang = "he", state = "active" }) => {
  const t = WCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  const accent = "#d97047";

  const stateLabel = {
    active: lang === "he" ? "בצע" : "Lift",
    rest: lang === "he" ? "נשם" : "Rest",
    between: lang === "he" ? "המשך" : "Move",
  }[state];

  return (
    <PhoneFrame dir={dir} label={`Sys3 · ${stateLabel} · ${lang === "he" ? "פריסה יציבה" : "Stable layout"}`}>
      <StatusBar />
      {/* Persistent header */}
      <div style={{ padding: "4px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#c9c2b6" }}>{t.benchPress}</div>
        <div style={{ fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>2/3 · ex 2/4</div>
      </div>
      <div style={{ padding: "8px 22px 0", display: "flex", gap: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < 1 ? accent : "#2a2724" }} />
        ))}
      </div>

      {/* Content area — same shape always */}
      <div style={{ padding: "26px 22px 0", textAlign: "center" }}>
        <div style={{
          fontSize: 11, color: accent, letterSpacing: 2, fontWeight: 700, marginBottom: 8,
        }}>{stateLabel.toUpperCase()}</div>

        {state === "active" && (
          <>
            <div style={{ fontSize: 96, fontWeight: 900, color: "#f5f1ea", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: -3 }}>
              12.5
            </div>
            <div style={{ fontSize: 13, color: "#8a8378", marginTop: 6 }}>{t.kg} · 8 {t.reps}</div>
          </>
        )}
        {state === "rest" && (
          <>
            <div style={{ fontSize: 96, fontWeight: 900, color: "#f5f1ea", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: -3 }}>
              1:24
            </div>
            <div style={{ fontSize: 13, color: "#8a8378", marginTop: 6 }}>{lang === "he" ? "סט הבא: 12.5 × 8" : "next: 12.5 × 8"}</div>
          </>
        )}
        {state === "between" && (
          <>
            <div style={{ fontSize: 38, fontWeight: 900, color: "#f5f1ea", lineHeight: 1.1, letterSpacing: lang === "he" ? -0.5 : -1.5 }}>
              {t.overhead}
            </div>
            <div style={{ fontSize: 13, color: "#8a8378", marginTop: 8 }}>3 × 8 · 10{t.kg}</div>
          </>
        )}
      </div>

      {/* Step indicator dots */}
      <div style={{ padding: "30px 22px 0", display: "flex", gap: 6, justifyContent: "center" }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: state === "active" ? accent : "#3a3633" }} />
        <span style={{ width: 6, height: 6, borderRadius: 3, background: state === "rest" ? accent : "#3a3633" }} />
        <span style={{ width: 6, height: 6, borderRadius: 3, background: state === "between" ? accent : "#3a3633" }} />
      </div>

      {/* CTA — always same position, always same shape */}
      <div style={{
        position: "absolute",
        bottom: 18, left: 16, right: 16,
        height: 84, background: accent, borderRadius: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#1c1b1a", fontSize: 21, fontWeight: 800,
      }}>
        {state === "active" ? `${t.done} ✓` : state === "rest" ? `${t.skip} →` : `${t.next} →`}
      </div>

      {/* Secondary actions — small, off to side */}
      <div style={{
        position: "absolute",
        bottom: 116, left: 0, right: 0,
        display: "flex", justifyContent: "space-around",
        fontSize: 11, color: "#5a5550",
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.addSet}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.addEx}</span>
      </div>
    </PhoneFrame>
  );
};

Object.assign(window, { WorkoutSys1, WorkoutSys2, WorkoutSys3 });

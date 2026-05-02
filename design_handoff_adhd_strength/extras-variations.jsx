// Bad-day, Rest-timer bottom sheet, Streak system, Empty/Offline states

const BCOPY = {
  he: {
    badTitle: "תופיע. זה הכל.",
    badSub: "סט אחד = יום שמור",
    one: "סט אחד",
    oneSub: "60 שניות",
    walk: "הליכה",
    walkSub: "10 דקות",
    stretch: "מתיחה",
    stretchSub: "5 דקות",
    rest: "מנוחה",
    offline: "אופליין · יישמר אוטומטית",
    restDay: "היום מנוחה",
    restDaySub: "אבל אם בא לך...",
    extra: "אימון נוסף",
    streak: "ימים ברצף",
  },
  en: {
    badTitle: "Show up. That's it.",
    badSub: "One set = day saved",
    one: "One set",
    oneSub: "60 seconds",
    walk: "Walk",
    walkSub: "10 min",
    stretch: "Stretch",
    stretchSub: "5 min",
    rest: "Rest",
    offline: "Offline · saving locally",
    restDay: "Rest day",
    restDaySub: "but if you want...",
    extra: "Extra workout",
    streak: "day streak",
  },
};

// ─── Bad day mode ────────────────────────────────────────────────────────
const BadDay = ({ lang = "he" }) => {
  const t = BCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  return (
    <PhoneFrame dir={dir} label={`${lang === "he" ? "יום קשה" : "Bad day"} · ${lang === "he" ? "תופיע" : "Show up"}`}
      note={lang === "he" ? "טון מפקד-קל. שלוש בחירות עצומות. כל אחת מקיימת את הסטריק." : "Drill-sergeant-light. Three giant choices. Any one keeps the streak."}>
      <StatusBar />
      <div style={{ padding: "20px 22px 0", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#a8421f", letterSpacing: 2, fontWeight: 700 }}>
          {lang === "he" ? "מצב יום קשה" : "BAD DAY MODE"}
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#f5f1ea", marginTop: 12, lineHeight: 1.1 }}>
          {t.badTitle}
        </div>
        <div style={{ fontSize: 13, color: "#8a8378", marginTop: 8 }}>{t.badSub}</div>
      </div>

      <div style={{ padding: "30px 18px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { l: t.one, s: t.oneSub, primary: true },
          { l: t.walk, s: t.walkSub },
          { l: t.stretch, s: t.stretchSub },
        ].map((b, i) => (
          <div key={i} style={{
            height: 96,
            borderRadius: 22,
            background: b.primary ? "#d97047" : "#252220",
            border: b.primary ? "none" : "1px solid #3a3633",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            color: b.primary ? "#1c1b1a" : "#f5f1ea",
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{b.l}</div>
              <div style={{ fontSize: 12, color: b.primary ? "#1c1b1a" : "#8a8378", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{b.s}</div>
            </div>
            <div style={{ fontSize: 24, opacity: 0.6 }}>→</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>
        ← {lang === "he" ? "חזור לאימון רגיל" : "back to normal"}
      </div>
    </PhoneFrame>
  );
};

// ─── Rest-timer bottom sheet (breathing) ─────────────────────────────────
const RestSheet = ({ lang = "he" }) => {
  const t = BCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  return (
    <PhoneFrame dir={dir} label={`${lang === "he" ? "טיימר מנוחה" : "Rest timer"} · ${lang === "he" ? "גיליון תחתון" : "Bottom sheet"}`}
      note={lang === "he" ? "המסך שמתחת מטושטש. נשימה ויזואלית. החלקה למטה לדלג." : "Screen behind blurs. Visual breathing. Swipe down to skip."}>
      <StatusBar />
      {/* Backdrop content (faded) */}
      <div style={{ padding: "10px 22px 0", opacity: 0.25, filter: "blur(2px)" }}>
        <div style={{ fontSize: 13, color: "#c9c2b6" }}>לחיצת חזה</div>
        <div style={{ fontSize: 80, fontWeight: 900, color: "#f5f1ea", textAlign: "center", marginTop: 30, fontFamily: "'JetBrains Mono', monospace" }}>12.5</div>
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 460,
        background: "#252220",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        border: "1px solid #3a3633",
        borderBottom: "none",
        padding: "12px 22px 22px",
        boxSizing: "border-box",
      }}>
        {/* Drag handle */}
        <div style={{ width: 44, height: 4, borderRadius: 2, background: "#3a3633", margin: "0 auto" }} />

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#a8421f", letterSpacing: 2, fontWeight: 700 }}>
            {t.rest.toUpperCase()}
          </div>

          {/* Breathing rings */}
          <div style={{
            margin: "26px auto 0",
            width: 200, height: 200,
            borderRadius: "50%",
            border: "2px solid #d97047",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 0 0 18px rgba(217,112,71,0.08), 0 0 0 38px rgba(217,112,71,0.04)",
          }}>
            <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: "1px dashed rgba(217,112,71,0.4)" }} />
            <div style={{
              fontSize: 58, fontWeight: 900, color: "#f5f1ea",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: -2,
            }}>1:24</div>
          </div>

          <div style={{ fontSize: 12, color: "#8a8378", marginTop: 18, letterSpacing: 1 }}>
            {lang === "he" ? "שאיפה … נשיפה" : "inhale … exhale"}
          </div>

          {/* Next preview */}
          <div style={{
            marginTop: 22,
            padding: "10px 16px",
            border: "1.5px dashed #3a3633",
            borderRadius: 14,
            display: "inline-flex",
            gap: 12,
            alignItems: "center",
            fontSize: 12,
            color: "#c9c2b6",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span style={{ color: "#5a5550" }}>{lang === "he" ? "הבא:" : "next:"}</span>
            <span>12.5{lang === "he" ? "ק״ג" : "kg"} × 8</span>
          </div>
        </div>
      </div>

      <SketchNote style={{ position: "absolute", top: 200, right: 8, transform: "rotate(8deg)", color: "#a8421f" }}>
        {lang === "he" ? "טבעת ←" : "→ ring"}<br/>{lang === "he" ? "פולס נשימה" : "breath pulse"}
      </SketchNote>
    </PhoneFrame>
  );
};

// ─── Streak system explorations ──────────────────────────────────────────
const StreakSystem = ({ lang = "he" }) => {
  const dir = lang === "he" ? "rtl" : "ltr";
  const days = lang === "he" ? ["א","ב","ג","ד","ה","ו","ש"] : ["S","M","T","W","T","F","S"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: 24 }}>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: "#1a1a1a" }}>
        {lang === "he" ? "מערכת סטריק · 4 גישות" : "Streak system · 4 takes"}
      </div>

      {/* 1: dots */}
      <div style={{ background: "#1c1b1a", padding: 20, borderRadius: 18, border: "2px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a" }}>
        <div style={{ fontSize: 11, color: "#5a5550", marginBottom: 10, letterSpacing: 1 }}>1 · DOTS</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", direction: "ltr" }}>
          {days.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 9, color: "#5a5550" }}>{d}</div>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: i < 4 ? "#d97047" : i === 4 ? "rgba(217,112,71,0.3)" : "transparent",
                border: i >= 5 ? "1.5px dashed #3a3633" : "none",
                boxShadow: i === 3 ? "0 0 0 4px rgba(217,112,71,0.2)" : "none",
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* 2: number + flame */}
      <div style={{ background: "#1c1b1a", padding: 20, borderRadius: 18, border: "2px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#5a5550", marginBottom: 6, letterSpacing: 1, textAlign: dir === "rtl" ? "right" : "left" }}>2 · NUMBER + GLYPH</div>
        <div style={{ fontSize: 72, fontWeight: 900, color: "#d97047", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: -3 }}>
          4 <span style={{ fontSize: 36, color: "#a8421f" }}>▲</span>
        </div>
        <div style={{ fontSize: 11, color: "#8a8378", letterSpacing: 1.5, marginTop: 6 }}>
          {(lang === "he" ? "ימים ברצף" : "DAY STREAK").toUpperCase()}
        </div>
      </div>

      {/* 3: heatmap */}
      <div style={{ background: "#1c1b1a", padding: 20, borderRadius: 18, border: "2px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a" }}>
        <div style={{ fontSize: 11, color: "#5a5550", marginBottom: 10, letterSpacing: 1 }}>3 · 4-WEEK HEATMAP</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, direction: "ltr" }}>
          {Array.from({length: 28}).map((_, i) => {
            const intensity = Math.random();
            const filled = i < 22 && intensity > 0.3;
            return <div key={i} style={{
              aspectRatio: 1,
              borderRadius: 4,
              background: filled
                ? `rgba(217,112,71,${0.3 + intensity * 0.7})`
                : "#2a2724",
            }} />;
          })}
        </div>
      </div>

      {/* 4: growing shape */}
      <div style={{ background: "#1c1b1a", padding: 20, borderRadius: 18, border: "2px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a" }}>
        <div style={{ fontSize: 11, color: "#5a5550", marginBottom: 10, letterSpacing: 1 }}>4 · GROWING BAR</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, justifyContent: "center", height: 90, direction: "ltr" }}>
          {[20, 35, 50, 70, 30, 0, 0].map((h, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: h || 4,
                borderRadius: 4,
                background: h > 0 ? "#d97047" : "#3a3633",
              }} />
              <div style={{ fontSize: 9, color: "#5a5550" }}>{days[i]}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#5a5550", textAlign: "center", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          {lang === "he" ? "סטים השבוע" : "sets this week"}
        </div>
      </div>
    </div>
  );
};

// ─── Empty / Offline states ──────────────────────────────────────────────
const EdgeStates = ({ lang = "he" }) => {
  const t = BCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {/* Rest day */}
      <PhoneFrame dir={dir} height={500} label={lang === "he" ? "יום מנוחה" : "Rest day"}>
        <StatusBar />
        <div style={{ padding: "60px 22px 0", textAlign: "center" }}>
          <div style={{
            width: 100, height: 100,
            borderRadius: "50%",
            border: "1.5px dashed #3a3633",
            margin: "0 auto",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, color: "#5a5550",
          }}>○</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#f5f1ea", marginTop: 24 }}>{t.restDay}</div>
          <div style={{ fontSize: 13, color: "#8a8378", marginTop: 8 }}>{t.restDaySub}</div>
          <div style={{
            marginTop: 28,
            display: "inline-block",
            padding: "12px 22px",
            borderRadius: 16,
            border: "1.5px solid #d97047",
            color: "#d97047",
            fontSize: 14, fontWeight: 700,
          }}>+ {t.extra}</div>
        </div>
      </PhoneFrame>

      {/* Offline */}
      <PhoneFrame dir={dir} height={500} label={lang === "he" ? "אופליין" : "Offline"}>
        <StatusBar />
        {/* Banner */}
        <div style={{
          margin: "4px 14px 0",
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(217,170,71,0.12)",
          border: "1px solid rgba(217,170,71,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          color: "#d9aa47",
        }}>
          <span style={{ fontSize: 14 }}>◐</span>
          <span>{t.offline}</span>
        </div>
        <div style={{ padding: "30px 22px 0", textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#f5f1ea", fontFamily: "'JetBrains Mono', monospace" }}>12.5</div>
          <div style={{ fontSize: 12, color: "#8a8378", marginTop: 4 }}>{lang === "he" ? "האימון פועל כרגיל" : "workout works as usual"}</div>
          <div style={{
            marginTop: 28,
            padding: "8px 14px",
            display: "inline-block",
            borderRadius: 10,
            background: "rgba(217,170,71,0.08)",
            color: "#d9aa47",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}>3 {lang === "he" ? "סטים בתור" : "sets queued"} ↑</div>
        </div>
      </PhoneFrame>
    </div>
  );
};

Object.assign(window, { BadDay, RestSheet, StreakSystem, EdgeStates });

// PR-targeting workout views — show user the 1RM record they're chasing,
// how to break it (more weight OR more reps), with AI coaching tips.
// Three variations: A) Target bar, B) Ghost-set duel, C) Two-paths choice

const PRCOPY = {
  he: {
    chase: "רודף שיא",
    record: "השיא שלך",
    oneRM: "1RM",
    today: "היום",
    needed: "צריך",
    or: "או",
    moreReps: "חזרה נוספת",
    moreWeight: "0.5 ק״ג נוסף",
    breakIt: "שובר שיא",
    crushIt: "תכניס אותו",
    pathReps: "מסלול חזרות",
    pathWeight: "מסלול משקל",
    aiTip: "טיפ אימון",
    tipReps: "התרכז בתנועה איטית בדרך למטה. עוד חזרה אחת נמצאת שם.",
    tipWeight: "השיא שלך נשבר ברבע ק״ג. הקפד על נשימה לפני הסט.",
    tipForm: "שמור על מרפק ב-45°. אם לא — דלג והוסף סט.",
    benchPress: "לחיצת חזה",
    set: "סט",
    weight: "משקל",
    reps: "חזרות",
    kg: "ק״ג",
    done: "סיימתי",
    pickPath: "בחר מסלול",
  },
  en: {
    chase: "Chasing PR",
    record: "Your record",
    oneRM: "1RM",
    today: "Today",
    needed: "Need",
    or: "or",
    moreReps: "+1 rep",
    moreWeight: "+0.5 kg",
    breakIt: "Break PR",
    crushIt: "Crush it",
    pathReps: "Reps path",
    pathWeight: "Weight path",
    aiTip: "Coach tip",
    tipReps: "Slow on the way down. One more rep is in there.",
    tipWeight: "PR breaks at +0.25kg. Take a breath before the set.",
    tipForm: "Elbow at 45°. If not — skip and add a set.",
    benchPress: "Bench press",
    set: "Set",
    weight: "Weight",
    reps: "Reps",
    kg: "kg",
    done: "Done",
    pickPath: "Pick path",
  },
};

// Tiny coach badge
const CoachTip = ({ text, lang = "he" }) => {
  const t = PRCOPY[lang];
  return (
    <div style={{
      padding: "10px 14px",
      borderRadius: 14,
      background: "rgba(122,108,217,0.10)",
      border: "1px solid rgba(122,108,217,0.25)",
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "#7a6cd9",
        color: "#1c1b1a", fontSize: 11, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>AI</div>
      <div style={{ textAlign: "start" }}>
        <div style={{ fontSize: 9, color: "#7a6cd9", letterSpacing: 1.5, fontWeight: 700 }}>
          {t.aiTip.toUpperCase()}
        </div>
        <div style={{ fontSize: 12, color: "#c9c2b6", marginTop: 2, lineHeight: 1.35 }}>
          {text}
        </div>
      </div>
    </div>
  );
};

// ─── PR Variation A: Target bar — single PR meter at top ─────────────────
const WorkoutPR_A = ({ lang = "he" }) => {
  const t = PRCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  const accent = "#d97047";

  // current set is 8 reps × 12.5; PR is 8×12.5 (matched). One more rep OR +0.5kg breaks it.
  return (
    <PhoneFrame dir={dir} label={`PR-A · ${lang === "he" ? "פס יעד" : "Target bar"}`}
      note={lang === "he" ? "מד שיא בראש המסך. שני מסלולים שווים: עוד חזרה או עוד משקל." : "PR meter at the top. Two equal paths: one more rep, or more weight."}>
      <StatusBar />
      <div style={{ padding: "4px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#c9c2b6" }}>{t.benchPress}</div>
        <div style={{ fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>{t.set} 3/3</div>
      </div>

      {/* PR meter */}
      <div style={{ margin: "12px 18px 0", padding: "12px 14px", borderRadius: 18, background: "#252220", border: `1px solid ${accent}55` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", direction: "ltr" }}>
          <div style={{ textAlign: align === "right" ? "left" : "left" }}>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 2, fontWeight: 700 }}>{t.chase.toUpperCase()}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "#c9c2b6" }}>
              {t.oneRM} <span style={{ color: accent }}>14.5{lang === "he" ? "" : "kg"}</span>
            </div>
          </div>
          <div style={{ fontSize: 22 }}>△</div>
        </div>
        {/* progress bar */}
        <div style={{ height: 8, background: "#1c1b1a", borderRadius: 4, marginTop: 10, overflow: "hidden", direction: "ltr" }}>
          <div style={{ width: "92%", height: "100%", background: `linear-gradient(90deg, ${accent}, #f5934d)` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#8a8378", fontFamily: "'JetBrains Mono', monospace", direction: "ltr" }}>
          <span>13.5{lang === "he" ? "" : "kg"} (PR)</span>
          <span style={{ color: accent }}>{lang === "he" ? "צריך 14kg" : "need 14kg"}</span>
        </div>
      </div>

      {/* Big numbers */}
      <div style={{ padding: "22px 22px 0", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 84, fontWeight: 900, color: "#f5f1ea", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: -3 }}>13.5</span>
          <span style={{ fontSize: 16, color: "#8a8378" }}>{t.kg}</span>
        </div>
        <div style={{ fontSize: 13, color: "#8a8378", marginTop: 4 }}>× 8 {t.reps}</div>
      </div>

      {/* Two-path choice */}
      <div style={{ padding: "20px 18px 0", display: "flex", gap: 10 }}>
        <div style={{ flex: 1, padding: "10px 12px", borderRadius: 14, background: `${accent}18`, border: `1.5px solid ${accent}`, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: accent, letterSpacing: 1.5, fontWeight: 700 }}>{t.pathReps.toUpperCase()}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f5f1ea", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>+1</div>
          <div style={{ fontSize: 10, color: "#8a8378", marginTop: 2 }}>{t.moreReps}</div>
        </div>
        <div style={{ flex: 1, padding: "10px 12px", borderRadius: 14, background: "#252220", border: "1.5px solid #3a3633", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#8a8378", letterSpacing: 1.5, fontWeight: 700 }}>{t.pathWeight.toUpperCase()}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#c9c2b6", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>+0.5</div>
          <div style={{ fontSize: 10, color: "#8a8378", marginTop: 2 }}>{t.moreWeight}</div>
        </div>
      </div>

      {/* AI tip */}
      <div style={{ padding: "14px 18px 0" }}>
        <CoachTip text={t.tipReps} lang={lang} />
      </div>

      {/* CTA */}
      <div style={{
        position: "absolute",
        bottom: 18, left: 16, right: 16,
        height: 84, background: accent, borderRadius: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#1c1b1a", fontSize: 21, fontWeight: 800,
        boxShadow: "0 0 0 6px rgba(217,112,71,0.2)",
      }}>
        {t.breakIt} △
      </div>
    </PhoneFrame>
  );
};

// ─── PR Variation B: Ghost-set duel — last PR shown as ghost ──────────────
const WorkoutPR_B = ({ lang = "he" }) => {
  const t = PRCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  const accent = "#d97047";
  return (
    <PhoneFrame dir={dir} label={`PR-B · ${lang === "he" ? "סט-רפאים" : "Ghost duel"}`}
      note={lang === "he" ? "השיא הקודם רץ במקביל כסט-רפאים. ויזואלית — להכות את העבר." : "Past PR runs as a ghost set. Visually beat your past self."}>
      <StatusBar />
      <div style={{ padding: "4px 22px 0", display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, color: "#c9c2b6" }}>{t.benchPress}</div>
        <div style={{ fontSize: 11, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>{t.set} 3/3</div>
      </div>

      {/* Duel card */}
      <div style={{ margin: "16px 18px 0", padding: "16px", borderRadius: 22, background: "#252220", border: "1px solid #3a3633" }}>
        <div style={{ fontSize: 9, color: accent, letterSpacing: 2, fontWeight: 700, textAlign: align }}>
          {t.chase.toUpperCase()} · {t.oneRM} 14.5{lang === "he" ? "" : "kg"}
        </div>

        {/* Ghost row (past PR) */}
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1.5px dashed #3a3633" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", direction: "ltr" }}>
            <div style={{ fontSize: 10, color: "#8a8378", fontFamily: "'JetBrains Mono', monospace" }}>
              {lang === "he" ? "השיא הקודם" : "PAST PR"} · 14 {lang === "he" ? "ימים" : "d ago"}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#8a8378", fontSize: 18, fontWeight: 700 }}>
              13.5 × 8
            </div>
          </div>
        </div>

        {/* You row */}
        <div style={{ marginTop: 8, padding: "12px 12px", borderRadius: 12, background: `${accent}15`, border: `1.5px solid ${accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", direction: "ltr" }}>
            <div style={{ fontSize: 10, color: accent, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
              {t.today.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f5f1ea", fontSize: 28, fontWeight: 900 }}>
              13.5 × <span style={{ color: accent }}>9?</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#c9c2b6" }}>
          {lang === "he" ? "חזרה אחת ושוברים" : "One more rep breaks it"} <span style={{ color: accent }}>△</span>
        </div>
      </div>

      {/* AI tip */}
      <div style={{ padding: "14px 18px 0" }}>
        <CoachTip text={t.tipReps} lang={lang} />
      </div>

      {/* Reps tally — visual */}
      <div style={{ padding: "16px 22px 0", display: "flex", gap: 6, justifyContent: "center", direction: "ltr" }}>
        {Array.from({length: 9}).map((_, i) => (
          <div key={i} style={{
            width: 22, height: 32,
            borderRadius: 6,
            background: i < 8 ? accent : i === 8 ? "transparent" : "#2a2724",
            border: i === 8 ? `2px dashed ${accent}` : "none",
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, color: "#5a5550", fontFamily: "'JetBrains Mono', monospace" }}>
        8 / <span style={{ color: accent }}>9</span> {t.reps}
      </div>

      <div style={{
        position: "absolute",
        bottom: 18, left: 16, right: 16,
        height: 84, background: accent, borderRadius: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#1c1b1a", fontSize: 21, fontWeight: 800,
      }}>
        {t.crushIt} △
      </div>
    </PhoneFrame>
  );
};

// ─── PR Variation C: Two-paths choice screen (between sets) ──────────────
const WorkoutPR_C = ({ lang = "he" }) => {
  const t = PRCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const align = lang === "he" ? "right" : "left";
  const accent = "#d97047";
  return (
    <PhoneFrame dir={dir} label={`PR-C · ${lang === "he" ? "בחר מסלול" : "Pick a path"}`}
      note={lang === "he" ? "אחרי הסט: מציג שני מסלולי שיא. החלטה אחת. שני מסלולים שווים." : "Between sets: two PR paths. One decision. Both equally celebrated."}>
      <StatusBar />
      <div style={{ padding: "4px 22px 0", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: accent, letterSpacing: 2, fontWeight: 700 }}>
          ✓ {lang === "he" ? "סט הושלם" : "SET DONE"}
        </div>
        <div style={{ fontSize: 13, color: "#8a8378", marginTop: 2 }}>
          {t.benchPress} · 13.5 × 8
        </div>
      </div>

      {/* PR card */}
      <div style={{
        margin: "20px 18px 0",
        padding: "18px",
        borderRadius: 22,
        background: "linear-gradient(160deg, #2a1f1a 0%, #1c1b1a 100%)",
        border: `1px solid ${accent}55`,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 10, color: accent, letterSpacing: 2, fontWeight: 700 }}>{t.record.toUpperCase()}</div>
        <div style={{ fontSize: 56, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#f5f1ea", lineHeight: 1, marginTop: 6, letterSpacing: -2 }}>
          14.5<span style={{ fontSize: 22, color: "#8a8378" }}>{t.kg}</span>
        </div>
        <div style={{ fontSize: 11, color: "#5a5550", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
          {t.oneRM} · {lang === "he" ? "8 בפב 25" : "Feb 8, 25"}
        </div>
      </div>

      <div style={{ padding: "18px 22px 8px", textAlign: "center", fontSize: 14, color: "#c9c2b6", fontWeight: 600 }}>
        {t.pickPath} ↓
      </div>

      {/* Two giant paths */}
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{
          padding: "16px 18px",
          borderRadius: 20,
          background: `${accent}20`,
          border: `1.5px solid ${accent}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: align,
        }}>
          <div>
            <div style={{ fontSize: 10, color: accent, letterSpacing: 1.5, fontWeight: 700 }}>{t.pathReps.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f5f1ea", marginTop: 2 }}>13.5 × <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>9</span></div>
            <div style={{ fontSize: 11, color: "#8a8378", marginTop: 2 }}>{t.moreReps}</div>
          </div>
          <div style={{ fontSize: 26, color: accent }}>△</div>
        </div>

        <div style={{
          padding: "16px 18px",
          borderRadius: 20,
          background: "#252220",
          border: "1.5px solid #3a3633",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: align,
        }}>
          <div>
            <div style={{ fontSize: 10, color: "#c9c2b6", letterSpacing: 1.5, fontWeight: 700 }}>{t.pathWeight.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f5f1ea", marginTop: 2 }}><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>14</span> × 8</div>
            <div style={{ fontSize: 11, color: "#8a8378", marginTop: 2 }}>{t.moreWeight}</div>
          </div>
          <div style={{ fontSize: 26, color: "#c9c2b6" }}>△</div>
        </div>
      </div>

      {/* AI tip — form-based */}
      <div style={{ padding: "16px 18px 0" }}>
        <CoachTip text={t.tipForm} lang={lang} />
      </div>
    </PhoneFrame>
  );
};

// ─── PR celebration overlay (broke it!) ──────────────────────────────────
const PRCelebration = ({ lang = "he" }) => {
  const t = PRCOPY[lang];
  const dir = lang === "he" ? "rtl" : "ltr";
  const accent = "#d97047";
  return (
    <PhoneFrame dir={dir} label={`${lang === "he" ? "חוגגים שיא" : "PR celebration"}`}
      note={lang === "he" ? "אוברליי מלא. מספר ענק. דופמין." : "Full overlay. Giant number. Dopamine."}>
      <StatusBar />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1c1b1a 0%, #2a1f1a 100%)" }} />
      <div style={{ position: "relative", padding: "60px 22px 0", textAlign: "center" }}>
        <div style={{ fontSize: 58, fontFamily: "'Caveat', cursive", color: accent, lineHeight: 1, transform: "rotate(-3deg)" }}>
          {lang === "he" ? "שיא חדש!" : "New PR!"}
        </div>
        <div style={{ fontSize: 14, color: "#c9c2b6", marginTop: 8, letterSpacing: 1 }}>
          {t.benchPress.toUpperCase()}
        </div>
        <div style={{
          marginTop: 30,
          fontSize: 130, fontWeight: 900, color: "#f5f1ea",
          fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: -5,
        }}>14<span style={{ fontSize: 38, color: accent }}>{t.kg}</span></div>
        <div style={{ fontSize: 18, color: "#8a8378", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          × 8 {t.reps}
        </div>

        {/* Delta */}
        <div style={{
          marginTop: 28,
          display: "inline-flex",
          padding: "8px 16px",
          borderRadius: 999,
          background: `${accent}25`,
          color: accent,
          fontSize: 13, fontWeight: 700,
          gap: 6,
        }}>
          △ +0.5{t.kg} {lang === "he" ? "מהשיא הקודם" : "vs past PR"}
        </div>

        <div style={{ marginTop: 30, padding: "0 8px" }}>
          <CoachTip text={lang === "he"
            ? "מקצועי. בפעם הבאה — נסה 14.5kg × 6. תן לגוף יום נוסף לפני המסלול הבא."
            : "Clean. Next time try 14.5kg × 6. Give your body an extra day before next push."} lang={lang} />
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: 18, left: 16, right: 16,
        height: 76, background: accent, borderRadius: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#1c1b1a", fontSize: 19, fontWeight: 800,
      }}>
        {lang === "he" ? "המשך אימון →" : "Continue →"}
      </div>
    </PhoneFrame>
  );
};

Object.assign(window, { WorkoutPR_A, WorkoutPR_B, WorkoutPR_C, PRCelebration, CoachTip });

// Lo-fi phone frame with sketchy outline. Used inside DCArtboards.
// Width 360, content area 360 wide, height variable.

const PhoneFrame = ({ children, height = 720, label, dir = "rtl", note }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      {label && (
        <div style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 22,
          color: "#1a1a1a",
          letterSpacing: 0.3,
        }}>{label}</div>
      )}
      <div style={{
        width: 360,
        height,
        borderRadius: 44,
        background: "#0d0d0e",
        border: "2.5px solid #1a1a1a",
        boxShadow: "6px 6px 0 #1a1a1a",
        padding: 10,
        position: "relative",
        boxSizing: "border-box",
      }}>
        {/* notch */}
        <div style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 90,
          height: 22,
          background: "#1a1a1a",
          borderRadius: 12,
          zIndex: 5,
        }} />
        <div dir={dir} style={{
          width: "100%",
          height: "100%",
          borderRadius: 34,
          background: "#1c1b1a",
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Heebo', system-ui, sans-serif",
          color: "#f5f1ea",
        }}>
          {children}
        </div>
      </div>
      {note && (
        <div style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 17,
          color: "#5a5550",
          maxWidth: 340,
          textAlign: "center",
          lineHeight: 1.3,
        }}>{note}</div>
      )}
    </div>
  );
};

// Sketchy annotation (handwritten margin note)
const SketchNote = ({ children, style = {} }) => (
  <div style={{
    fontFamily: "'Caveat', cursive",
    fontSize: 18,
    color: "#a8421f",
    lineHeight: 1.2,
    ...style,
  }}>{children}</div>
);

// Dashed box placeholder
const DashBox = ({ children, height, style = {} }) => (
  <div style={{
    border: "1.5px dashed #5a5550",
    borderRadius: 12,
    padding: "10px 14px",
    height,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8a8378",
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    ...style,
  }}>{children}</div>
);

// Status bar (sketchy)
const StatusBar = ({ dir = "rtl" }) => (
  <div style={{
    height: 44,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: "0 22px 6px",
    fontSize: 13,
    fontWeight: 600,
    color: "#c9c2b6",
    direction: "ltr",
  }}>
    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>9:41</span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.7 }}>●●● ▮</span>
  </div>
);

Object.assign(window, { PhoneFrame, SketchNote, DashBox, StatusBar });

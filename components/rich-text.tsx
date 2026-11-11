import type { ReactNode } from "react";

/**
 * Renders the simple About text format as plain React elements (no HTML injection):
 *   "# Title"  heading, "- item" list item, blank line = new paragraph.
 */
export default function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const out: ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    let list: string[] = [];
    let para: string[] = [];

    const flushList = (key: string) => {
      if (list.length === 0) return;
      out.push(
        <ul key={key} style={{ paddingLeft: 20, marginBottom: 16 }}>
          {list.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      );
      list = [];
    };
    const flushPara = (key: string) => {
      if (para.length === 0) return;
      out.push(
        <p key={key} style={{ marginBottom: 14 }}>
          {para.join(" ")}
        </p>
      );
      para = [];
    };

    lines.forEach((line, li) => {
      const key = `${bi}-${li}`;
      if (line.startsWith("# ")) {
        flushList(`l${key}`);
        flushPara(`p${key}`);
        out.push(
          <h2 key={`h${key}`} style={{ fontSize: 18, fontWeight: 800, margin: "20px 0 8px" }}>
            {line.slice(2).trim()}
          </h2>
        );
      } else if (line.startsWith("- ")) {
        flushPara(`p${key}`);
        list.push(line.slice(2).trim());
      } else {
        flushList(`l${key}`);
        para.push(line.trim());
      }
    });
    flushList(`le${bi}`);
    flushPara(`pe${bi}`);
  });

  return <>{out}</>;
}

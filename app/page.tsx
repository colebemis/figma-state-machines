"use client";

import { getTextForSelection } from "@/lib/get-text-for-selection";
import { useState } from "react";

export default function Plugin() {
  const [text, setText] = useState("");
  return (
    <div>
      <button
        onClick={async () => {
          const text = await getTextForSelection();
          setText(text.join("\n"));
        }}
      >
        Get selected text
      </button>
      {text}
    </div>
  );
}

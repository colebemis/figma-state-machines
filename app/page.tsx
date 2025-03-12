"use client";

import { useVariable } from "@/lib/use-variable";
import React from "react";

export default function Plugin() {
  const [count, setCount] = useVariable("count", "FLOAT", 10);
  const [message, setMessage] = useVariable("message", "STRING", "Hello");

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <div>{count}</div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <div>{message}</div>
    </div>
  );
}

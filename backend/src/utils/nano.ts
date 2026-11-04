import { randomInt } from "node:crypto";

/** Small nanoid-style alphabet helper (no extra dependency). */
export function customAlphabet(alphabet: string, size: number) {
  return function generate(length = size) {
    let out = "";
    for (let i = 0; i < length; i += 1) {
      out += alphabet[randomInt(alphabet.length)];
    }
    return out;
  };
}

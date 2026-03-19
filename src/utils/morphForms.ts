import { useMemo } from 'react';
import type { AppData } from '../types';

/** Scan all story tokens and collect every surface form used per lemma. */
export function computeMorphForms(data: AppData): Record<string, string[]> {
  const forms: Record<string, Set<string>> = {};
  for (const story of Object.values(data.stories)) {
    for (const token of story.tokens) {
      if (token.type === 'nonce') {
        const lemma = token.lemma ?? token.text.toLowerCase();
        if (!forms[lemma]) forms[lemma] = new Set();
        forms[lemma].add(token.text.toLowerCase());
      }
    }
  }
  const result: Record<string, string[]> = {};
  for (const [lemma, set] of Object.entries(forms)) {
    result[lemma] = [...set].sort();
  }
  return result;
}

export function useMorphForms(data: AppData): Record<string, string[]> {
  return useMemo(() => computeMorphForms(data), [data]);
}

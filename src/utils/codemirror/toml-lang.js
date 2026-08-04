import { parser } from 'lezer-toml'
import {
  LRLanguage,
  LanguageSupport,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  delimitedIndent,
} from '@codemirror/language'

/**
 * CodeMirror 6 language support for TOML.
 * Uses the lezer-toml Lezer grammar for accurate syntax highlighting.
 */
export const tomlLanguage = LRLanguage.define({
  name: 'toml',
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Table: delimitedIndent({ closing: ']', align: false }),
        Array: delimitedIndent({ closing: ']', align: false }),
        InlineTable: delimitedIndent({ closing: '}', align: false }),
      }),
      foldNodeProp.add({
        Table: foldInside,
        Array: foldInside,
        InlineTable: foldInside,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: '#' },
  },
})

/**
 * Returns a LanguageSupport extension for TOML.
 */
export function toml() {
  return new LanguageSupport(tomlLanguage)
}

/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { Settings } from 'luxon'
import PropTypes from 'prop-types'
import {
  Provider,
  ReactElement,
  createContext,
  memo,
  useContext,
  useEffect,
  useState,
} from 'react'
import { sprintf } from 'sprintf-js'
import root from 'window-or-global'

import { LANGUAGES, LANGUAGES_URL, T } from 'client/constants'
import { useAuth } from 'client/features/Auth'
import { isDevelopment } from 'client/utils'
import { findKey } from 'lodash'

const TranslateContext = createContext()

/**
 * @typedef {
 * string |
 * string[] |
 * { word: string, values: string|string[] }
 * } WordTranslation - The word to translate
 */

/**
 * @typedef {string|string[]} ValuesTranslation
 * - The The values to override in the translation
 */

/**
 * Checks if the value is valid to translation.
 *
 * @param {WordTranslation} val - The value to translate
 * @returns {boolean} - True if the value can be translated
 */
const labelCanBeTranslated = (val) =>
  typeof val === 'string' ||
  (Array.isArray(val) && val.length === 2) ||
  (typeof val === 'object' && val?.word)

/**
 * Transforms the final string to be translated.
 *
 * @param {WordTranslation} word - The word to translate
 * @param {ValuesTranslation} values - The The values to override in the translation
 * @returns {boolean} - True if the value can be translated
 */
const translateString = (word = '', values) => {
  // Get the translation context so hash will be the map with the language that is using the user
  const { hash = {} } = useContext(TranslateContext)

  // Look for the key thas has the value equal to word in the T object
  const key = findKey(T, (value) => value === word)

  // Using the key from the previous step, get the translated word in the language map
  const { [key]: wordVal } = hash

  // If there is no word, use the original
  const ensuredWord = wordVal || word
  if (!ensuredWord || !values) return ensuredWord

  // Return translation
  try {
    return sprintf(ensuredWord, ...values)
  } catch {
    return word
  }
}

/**
 * Provider for the translate context.
 *
 * @param {object} props - The props of the provider
 * @param {any} props.children - Children
 * @returns {Provider} - The translation provider
 */
const TranslateProvider = ({ children = [] }) => {
  const [hash, setHash] = useState({})
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { LANG: lang } = fireedge

  useEffect(() => {
    if (!lang || !LANGUAGES[lang]) return

    try {
      Settings.defaultLocale = lang.replace('_', '-')
      const script = root.document.createElement('script', {})

      script.src = `${LANGUAGES_URL}/${lang}.js`
      script.async = true
      script.onload = () => {
        setHash(window.locale)

        // delete script and variables after load
        delete window.lang
        delete window.locale
        window.document.body.removeChild(script)
      }

      window.document.body.appendChild(script)
    } catch (error) {
      isDevelopment() &&
        console.error('Error while generating script language', error)
    }
  }, [lang])

  return (
    <TranslateContext.Provider value={{ lang, hash }}>
      {children}
    </TranslateContext.Provider>
  )
}

/**
 * Function to translate a label.
 *
 * @param {WordTranslation} word - The label to translate
 * @param {Array} values - The values to override in the translation
 * @returns {string} - The translated label
 */
const Tr = (word = '', values = []) => {
  const [w = '', v = values] = Array.isArray(word) ? word : [word, values]
  const ensuredValues = !Array.isArray(v) ? [v] : v

  return translateString(w, ensuredValues.filter(Boolean))
}

/**
 * Translate component.
 *
 * @param {object} props - The props of the component
 * @param {WordTranslation} props.word - The word to translate
 * @param {string|string[]} [props.values] - The values to override in the translation
 * @returns {ReactElement} - The translated component
 */
const Translate = memo(({ word = '', values = [] }) => {
  const [w, v = values] = Array.isArray(word) ? word : [word, values]
  const ensuredValues = !Array.isArray(v) ? [v] : v
  const translation = translateString(
    w,
    ensuredValues.filter((value) => value || value === 0)
  )

  return <>{translation}</>
})

TranslateProvider.propTypes = { children: PropTypes.any }

Translate.propTypes = {
  word: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  values: PropTypes.any,
}

Tr.displayName = 'Tr'
Translate.displayName = 'Translate'

export {
  Tr,
  Translate,
  TranslateContext,
  TranslateProvider,
  labelCanBeTranslated,
}

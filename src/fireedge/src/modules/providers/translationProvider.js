/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
 * limitations under the License.                                           *
 * ------------------------------------------------------------------------- */
import { Settings } from 'luxon'
import PropTypes from 'prop-types'
import {
  ReactElement,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import root from 'window-or-global'

import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGES_URL } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import { decodeEntities, isDevelopment } from '@UtilsModule'
import { getSharedTranslationContext } from '@modules/providers/translationContext'
import {
  formatTranslation,
  formatTranslationText,
} from '@modules/providers/translationFormat'

export {
  formatTranslation,
  formatTranslationText,
} from '@modules/providers/translationFormat'

const TranslationContext = getSharedTranslationContext({
  error: null,
  isLoading: false,
  locale: DEFAULT_LANGUAGE,
  messages: {},
  translate: (message, values) =>
    decodeEntities(formatTranslation({}, message, values)),
  translateText: (message, values) =>
    formatTranslationText({}, message, values),
})

const loadMessages = (locale) => {
  const document = root.document

  if (!document?.body) {
    return { cancel: () => undefined, promise: Promise.resolve({}) }
  }

  const script = document.createElement('script')
  let cancelled = false

  script.src = `${LANGUAGES_URL}/${locale}.js`
  script.async = true
  script.dataset.translationLocale = locale

  const cleanup = () => {
    script.onload = null
    script.onerror = null
    script.remove()
  }

  const promise = new Promise((resolve, reject) => {
    script.onload = () => {
      const messages = root.locale ?? {}

      delete root.lang
      delete root.locale
      cleanup()
      !cancelled && resolve(messages)
    }
    script.onerror = () => {
      cleanup()
      !cancelled && reject(new Error(`Unable to load locale "${locale}"`))
    }

    document.body.appendChild(script)
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
      cleanup()
    },
  }
}

/**
 * Provides the active locale and translation function.
 *
 * When the server preloads a locale catalog into `window.locale` (via the
 * `preload-locale` script tag in App.js), the provider initialises with
 * those messages immediately, eliminating the first-render flash of
 * untranslated text. The async `loadMessages` call still runs to ensure
 * the full catalog is loaded; if the preloaded catalog is already complete,
 * the state simply updates to the same value.
 *
 * @param {object} props - Provider props
 * @param {any} props.children - Application tree
 * @returns {ReactElement} Translation context provider
 */
export const TranslationProvider = ({ children }) => {
  const { settings = {} } = useAuth()
  const requestedLocale =
    settings.LANG ?? settings.FIREEDGE?.LANG ?? DEFAULT_LANGUAGE
  const fallbackLocale = LANGUAGES[DEFAULT_LANGUAGE] ? DEFAULT_LANGUAGE : 'en'
  const locale = LANGUAGES[requestedLocale] ? requestedLocale : fallbackLocale

  // Use server-side preloaded translations if available to eliminate
  // the first-render flash of untranslated (English) text.
  const preloadedMessages = root.locale ?? {}
  const hasPreloaded = Object.keys(preloadedMessages).length > 0

  const [state, setState] = useState({
    error: null,
    isLoading: !hasPreloaded,
    locale,
    messages: preloadedMessages,
  })

  useEffect(() => {
    Settings.defaultLocale = locale.replace('_', '-')
    setState((current) => ({ ...current, error: null, isLoading: true }))

    const request = loadMessages(locale)
    let active = true
    request.promise
      .then((messages) => {
        active && setState({ error: null, isLoading: false, locale, messages })
      })
      .catch((error) => {
        if (!active) return
        isDevelopment() && console.error(error)
        setState((current) => ({ ...current, error, isLoading: false }))
      })

    return () => {
      active = false
      request.cancel()
    }
  }, [locale])

  const translate = useCallback(
    (message, values) =>
      decodeEntities(formatTranslation(state.messages, message, values)),
    [state.messages]
  )
  const translateText = useCallback(
    (message, values) => formatTranslationText(state.messages, message, values),
    [state.messages]
  )
  const context = useMemo(
    () => ({ ...state, translate, translateText }),
    [state, translate, translateText]
  )

  return (
    <TranslationContext.Provider value={context}>
      {children}
    </TranslationContext.Provider>
  )
}

/**
 * @returns {object} Active translation state and translator
 */
export const useTranslation = () => useContext(TranslationContext)

/**
 * Renders a translated string.
 *
 * @param {object} props - Component props
 * @param {string|string[]|object} props.word - Translation input
 * @param {any|any[]} props.values - Interpolation values
 * @returns {ReactElement} Translated text
 */
export const Translate = memo(({ word = '', values = [] }) => {
  const { translate } = useTranslation()

  return <>{translate(word, values)}</>
})

TranslationProvider.propTypes = { children: PropTypes.node }
Translate.propTypes = {
  values: PropTypes.any,
  word: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({
      message: PropTypes.string,
      values: PropTypes.any,
      word: PropTypes.string,
    }),
  ]),
}

TranslationProvider.displayName = 'TranslationProvider'
Translate.displayName = 'Translate'

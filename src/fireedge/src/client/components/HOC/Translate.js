/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useContext, useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'
import root from 'window-or-global'
import { sprintf } from 'sprintf-js'

import { useAuth } from 'client/features/Auth'
import { DEFAULT_LANGUAGE, LANGUAGES_URL } from 'client/constants'
import { isDevelopment } from 'client/utils'

const TranslateContext = createContext()
let languageScript = root.document?.createElement('script')

const labelCanBeTranslated = (val) =>
  typeof val === 'string' ||
  (Array.isArray(val) && val.length === 2) ||
  (typeof val === 'object' && val?.word)

const GenerateScript = (
  language = DEFAULT_LANGUAGE,
  setHash = () => undefined
) => {
  try {
    const script = root.document.createElement('script')
    script.src = `${LANGUAGES_URL}/${language}.js`
    script.async = true
    script.onload = () => {
      setHash(root.locale)
    }
    root.document.body.appendChild(script)
    languageScript = script
  } catch (error) {
    isDevelopment() &&
      console.error('Error while generating script language', error)
  }
}

const RemoveScript = () => {
  root.document.body.removeChild(languageScript)
}

const TranslateProvider = ({ children = [] }) => {
  const [hash, setHash] = useState({})
  const { settings: { LANG: lang } = {} } = useAuth()

  useEffect(() => {
    GenerateScript(lang, setHash)

    return () => {
      RemoveScript()
    }
  }, [lang])

  const changeLang = (language = DEFAULT_LANGUAGE) => {
    RemoveScript()
    GenerateScript(language, setHash)
  }

  return (
    <TranslateContext.Provider value={{ lang, hash, changeLang }}>
      {children}
    </TranslateContext.Provider>
  )
}

const translateString = (str = '', values) => {
  const context = useContext(TranslateContext)
  let key = str

  if (context?.hash?.[key]) {
    key = context.hash[key]
  }

  if (key && Array.isArray(values)) {
    try {
      key = sprintf(key, ...values)
    } catch (e) {
      return str
    }
  }

  return key
}

const Tr = (str = '') => {
  let key = str
  let values

  if (Array.isArray(str)) {
    key = str[0] || ''
    values = str[1]
  }

  const valuesTr = !Array.isArray(values) ? [values] : values

  return translateString(key, valuesTr.filter(Boolean))
}

const Translate = ({ word = '', values = [] }) => {
  const [w, v = values] = Array.isArray(word) ? word : [word, values]
  const valuesTr = !Array.isArray(v) ? [v] : v

  return translateString(w, valuesTr)
}

TranslateProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
}

Translate.propTypes = {
  word: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  values: PropTypes.any,
}

export {
  TranslateContext,
  TranslateProvider,
  Translate,
  Tr,
  labelCanBeTranslated,
}

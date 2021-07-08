/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import React, { useContext, useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'
import root from 'window-or-global'
import { sprintf } from 'sprintf-js'

import { useAuth } from 'client/features/Auth'
import { DEFAULT_LANGUAGE, LANGUAGES_URL } from 'client/constants'

const TranslateContext = createContext()
let languageScript = root.document?.createElement('script')

/**
 * @param language
 * @param setHash
 */
const GenerateScript = (
  language = DEFAULT_LANGUAGE,
  setHash = () => undefined
) => {
  try {
    const script = root.document.createElement('script')
    script.src = `${LANGUAGES_URL}/${language}.js`
    script.async = true
    /**
     *
     */
    script.onload = () => {
      setHash(root.locale)
    }
    root.document.body.appendChild(script)
    languageScript = script
  } catch (error) {
    console.warn('Error while generating script language')
  }
}

/**
 *
 */
const RemoveScript = () => {
  root.document.body.removeChild(languageScript)
}

/**
 * @param root0
 * @param root0.children
 */
const TranslateProvider = ({ children }) => {
  const [hash, setHash] = useState({})
  const { settings: { lang } = {} } = useAuth()

  useEffect(() => {
    GenerateScript(lang, setHash)
    return () => { RemoveScript() }
  }, [lang])

  /**
   * @param language
   */
  const changeLang = (language = DEFAULT_LANGUAGE) => {
    RemoveScript()
    GenerateScript(language, setHash)
  }

  const value = {
    lang,
    hash,
    changeLang
  }

  return (
    <TranslateContext.Provider value={value}>
      {children}
    </TranslateContext.Provider>
  )
}

/**
 * @param str
 * @param values
 */
const translate = (str = '', values) => {
  const context = useContext(TranslateContext)
  let key = str

  if (context?.hash?.[key]) {
    key = context.hash[key]
  }

  if (key && Array.isArray(values)) {
    key = sprintf(key, ...values)
  }

  return key
}

/**
 * @param str
 */
const Tr = (str = '') => {
  let key = str
  let values

  if (Array.isArray(str)) {
    key = str[0] || ''
    values = str[1]
  }

  const valuesTr = !Array.isArray(values) ? [values] : values

  return translate(key, valuesTr)
}

/**
 * @param root0
 * @param root0.word
 * @param root0.values
 */
const Translate = ({ word = '', values }) => {
  const valuesTr = !Array.isArray(values) ? [values] : values
  return translate(word, valuesTr)
}

TranslateProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
}

TranslateProvider.defaultProps = {
  children: []
}

Translate.propTypes = {
  word: PropTypes.string,
  values: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
}

Translate.defaultProps = {
  word: '',
  values: ''
}

export { TranslateContext, TranslateProvider, Translate, Tr }

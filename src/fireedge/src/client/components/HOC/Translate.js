/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React, { useContext, useState, useEffect, createContext } from 'react'
import PropTypes from 'prop-types'
import root from 'window-or-global'
import { Select } from '@material-ui/core'
import { sprintf } from 'sprintf-js'
import { DEFAULT_LANGUAGE, LANGUAGES_URL } from 'client/constants'

const TranslateContext = createContext()
let languageScript = root.document?.createElement('script')

const GenerateScript = (
  language = DEFAULT_LANGUAGE,
  setLang = () => undefined,
  setHash = () => undefined
) => {
  try {
    const script = root.document.createElement('script')
    script.src = `${LANGUAGES_URL}/${language}.js`
    script.async = true
    script.onload = () => {
      setLang(language)
      setHash(root.locale)
    }
    root.document.body.appendChild(script)
    languageScript = script
  } catch (error) {
    console.warn('Error while generating script language')
  }
}

const RemoveScript = () => {
  root.document.body.removeChild(languageScript)
}

const TranslateProvider = ({ children }) => {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE)
  const [hash, setHash] = useState({})

  useEffect(() => {
    GenerateScript(lang, setLang, setHash)
    return () => { RemoveScript() }
  }, [])

  const changeLang = (language = DEFAULT_LANGUAGE) => {
    RemoveScript()
    GenerateScript(language, setLang, setHash)
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

const translate = (str = '', values) => {
  const context = useContext(TranslateContext)
  let key = str

  if (context?.hash[key]) {
    key = context.hash[key]
  }

  if (Array.isArray(values)) {
    key = sprintf(key, ...values)
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

  return translate(key, valuesTr)
}

const SelectTranslate = props => {
  const context = useContext(TranslateContext)
  const languages = Array.isArray(root?.langs) ? root?.langs : []

  const handleChange = (e, changeLang) => {
    if (e?.target?.value && typeof changeLang === 'function') {
      changeLang(e.target.value)
    }
  }

  return (
    <Select
      native
      type="select"
      fullWidth
      onChange={e => handleChange(e, context.changeLang)}
      defaultValue={context.lang}
      {...props}
    >
      {languages.map(({ key, value }) => (
        <option value={key} key={key}>
          {value}
        </option>
      ))}
    </Select>
  )
}

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

export { TranslateContext, TranslateProvider, SelectTranslate, Translate, Tr }

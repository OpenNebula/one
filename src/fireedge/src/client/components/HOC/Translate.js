/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

import React, {
  useContext,
  useState,
  useEffect,
  createContext as CreateContext
} from 'react';
import PropTypes from 'prop-types';
import { Select } from '@material-ui/core';
import { sprintf } from 'sprintf-js';
import root from 'window-or-global';
import { defaultLang } from 'server/utils/constants/defaults';

const defaultFunction = () => undefined;
const TranslateContext = new CreateContext();
const document = root.document;
let languageScript =
  document && document.createElement && document.createElement('script');

const GenerateScript = (
  language = defaultLang,
  setLang = defaultFunction,
  setHash = defaultFunction
) => {
  try {
    const script = document.createElement('script');
    script.src = `/client/assets/languages/${language}.js`;
    script.async = true;
    script.onload = () => {
      setLang(language);
      setHash(root.locale);
    };
    document.body.appendChild(script);
    languageScript = script;
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

const RemoveScript = () => {
  document.body.removeChild(languageScript);
};

const TranslateProvider = ({ children }) => {
  const [lang, setLang] = useState(defaultLang);
  const [hash, setHash] = useState({});
  useEffect(() => {
    GenerateScript(lang, setLang, setHash);
    return () => {
      RemoveScript();
    };
  }, []);

  const changeLang = (language = defaultLang) => {
    RemoveScript();
    GenerateScript(language, setLang, setHash);
  };

  const value = {
    lang,
    hash,
    changeLang
  };

  return (
    <TranslateContext.Provider value={value}>
      {children}
    </TranslateContext.Provider>
  );
};

const Tr = (str = '', context = {}) => {
  let key = str;
  let replaceValues;
  let languagesContext = context;

  if (Array.isArray(str)) {
    key = str[0] || '';
    replaceValues = str[1];
  }

  if (
    Object.keys(languagesContext).length === 0 &&
    languagesContext.constructor === Object
  ) {
    try {
      languagesContext = useContext(TranslateContext);
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }

  if (languagesContext && languagesContext.hash && languagesContext.hash[key]) {
    const translate = languagesContext.hash[key];
    key = translate;
  }

  if (!!replaceValues && Array.isArray(replaceValues)) {
    key = sprintf(key, ...replaceValues);
  }
  return key;
};

const Translate = ({ word, values }) => {
  const context = useContext(TranslateContext);
  const handleChange = (e, changeLang) => {
    if (
      e &&
      e.target &&
      e.target.value &&
      changeLang &&
      typeof changeLang === 'function'
    ) {
      changeLang(e.target.value);
    }
  };

  const selector = current => {
    if (!word && current.changeLang && context.lang) {
      if (root.langs && Array.isArray(root.langs)) {
        const languages = root.langs;
        return (
          <Select
            native
            type="select"
            onChange={e => handleChange(e, current.changeLang)}
            defaultValue={context.lang}
          >
            {languages.map(({ key, value }) => (
              <option value={key} key={key}>{`${value}`}</option>
            ))}
          </Select>
        );
      }
    }
    const valuesTr = !!values && !Array.isArray(values) ? [values] : values;
    return Tr([word, valuesTr], context);
  };

  return <TranslateContext.Consumer>{selector}</TranslateContext.Consumer>;
};

TranslateProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

TranslateProvider.defaultProps = {
  children: []
};

Translate.propTypes = {
  word: PropTypes.string,
  values: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
};

Translate.defaultProps = {
  word: '',
  values: ''
};

export { TranslateContext, TranslateProvider, Translate, Tr };

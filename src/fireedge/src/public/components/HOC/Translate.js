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

import React, { useState, createContext as CreateContext } from 'react';
import PropTypes from 'prop-types';
import { Select } from '@material-ui/core';
import { sprintf } from 'sprintf-js';
import root from 'window-or-global';
import { translations, defaultLang } from '../../../utils/contants/defaults';

const langDefault = defaultLang;
const TranslateContext = new CreateContext();

const TranslateProvider = ({ children }) => {
  const [current, setCurrent] = useState(langDefault);

  const changeLang = (lang = langDefault) => {
    setCurrent(lang);
  };

  const value = {
    currentLang: current,
    changeLang
  };

  return (
    <TranslateContext.Provider value={value}>
      {children}
    </TranslateContext.Provider>
  );
};

const Tr = (str = '', fixedValues) => {
  let rtn = str;
  if (root && root.locale && root.locale[str]) {
    const translate = root.locale[str];
    rtn = translate;
    if (!!fixedValues && Array.isArray(fixedValues)) {
      rtn = sprintf(translate, ...fixedValues);
    }
  }
  return rtn;
};

const Translate = ({ word, values }) => {
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
    if (!word && current.changeLang) {
      const languages = Object.keys(translations);
      return (
        <Select
          native
          type="select"
          onChange={e => handleChange(e, current.changeLang)}
        >
          {languages.map(language => (
            <option
              value={language}
              key={language}
            >{`${translations[language]} (${language})`}</option>
          ))}
        </Select>
      );
    }
    const valuesTr = !!values && !Array.isArray(values) ? [values] : values;
    return Tr(word, valuesTr);
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

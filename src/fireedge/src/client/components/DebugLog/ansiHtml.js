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

// Reference to https://github.com/sindresorhus/ansi-regex
export const _regANSI =
  // eslint-disable-next-line no-control-regex
  /(?:(?:\u001b\[)|\u009b)(?:(?:[0-9]{1,3})?(?:(?:;[0-9]{0,3})*)?[A-M|f-m])|\u001b[A-M]/

const _defColors = {
  reset: ['fff', '000'], // [FOREGROUND_COLOR, BACKGROUND_COLOR]
  black: '000',
  red: 'ff0000',
  green: '209805',
  yellow: 'e8bf03',
  blue: '0000ff',
  magenta: 'ff00ff',
  cyan: '00ffee',
  lightgrey: 'f0f0f0',
  darkgrey: '888',
}
const _styles = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'lightgrey',
}
const _openTags = {
  1: 'font-weight:bold', // bold
  2: 'opacity:0.5', // dim
  3: '<i>', // italic
  4: '<u>', // underscore
  8: 'display:none', // hidden
  9: '<del>', // delete
}
const _closeTags = {
  23: '</i>', // reset italic
  24: '</u>', // reset underscore
  29: '</del>', // reset delete
}

;[0, 21, 22, 27, 28, 39, 49].forEach(function (n) {
  _closeTags[n] = '</span>'
})

/**
 * Converts text with ANSI color codes to HTML markup.
 *
 * @param {string} text - Text
 * @returns {string} HTML as string
 */
export default function ansiHTML(text) {
  // Returns the text if the string has no ANSI escape code.
  if (!_regANSI.test(text)) {
    return text
  }

  // Cache opened sequence.
  const ansiCodes = []

  // Replace with markup.
  let ret = text.replace(/\033\[(\d+)*m/g, function (match, seq) {
    const ot = _openTags[seq]
    if (ot) {
      // If current sequence has been opened, close it.
      if (~ansiCodes.indexOf(seq)) {
        ansiCodes.pop()

        return '</span>'
      }
      // Open tag.
      ansiCodes.push(seq)

      return ot[0] === '<' ? ot : `<span style="${ot};">`
    }

    const ct = _closeTags[seq]
    if (ct) {
      // Pop sequence
      ansiCodes.pop()

      return ct
    }

    return ''
  })

  // Make sure tags are closed.
  const l = ansiCodes.length
  l > 0 && (ret += Array(l + 1).join('</span>'))

  return ret
}

/**
 * Customize colors.
 *
 * @param {object} colors - Reference to _defColors
 */
ansiHTML.setColors = function (colors) {
  if (typeof colors !== 'object') {
    throw new Error("'colors' parameter must be an Object.")
  }

  const _finalColors = {}
  Object.entries(_defColors).forEach(([key, defHexColor]) => {
    let hex = Object.prototype.hasOwnProperty.call(colors, key)
      ? colors[key]
      : null

    if (!hex) {
      _finalColors[key] = defHexColor

      return
    }

    if (key === 'reset') {
      if (typeof hex === 'string') {
        hex = [hex]
      }

      if (
        !Array.isArray(hex) ||
        hex.length === 0 ||
        hex.some((h) => typeof h !== 'string')
      ) {
        throw new Error(
          `The value of '${key}' property must be an Array and each item could only be a hex string, e.g.: FF0000`
        )
      }

      if (!hex[0]) {
        hex[0] = defHexColor[0]
      }

      if (hex.length === 1 || !hex[1]) {
        hex = [hex[0]]
        hex.push(defHexColor[1])
      }

      hex = hex.slice(0, 2)
    } else if (typeof hex !== 'string') {
      throw new Error(
        `The value of '${key}' property must be a hex string, e.g.: FF0000`
      )
    }

    _finalColors[key] = hex
  })

  _setTags(_finalColors)
}

/**
 * Reset colors.
 */
ansiHTML.reset = function () {
  _setTags(_defColors)
}

/**
 * Expose tags, including open and close.
 *
 * @type {object}
 */
ansiHTML.tags = {}

if (Object.defineProperty) {
  Object.defineProperty(ansiHTML.tags, 'open', {
    get: function () {
      return _openTags
    },
  })
  Object.defineProperty(ansiHTML.tags, 'close', {
    get: function () {
      return _closeTags
    },
  })
} else {
  ansiHTML.tags.open = _openTags
  ansiHTML.tags.close = _closeTags
}

const _setTags = (colors) => {
  // reset all
  _openTags[0] = `font-weight:normal;opacity:1;color:#${colors.reset[0]};background:#${colors.reset[1]}`
  // inverse
  _openTags[7] = `color:#${colors.reset[1]};background:#${colors.reset[0]}`
  // dark grey
  _openTags[90] = `color:#${colors.darkgrey}`

  Object.entries(_styles).forEach(([code, color]) => {
    const oriColor = colors[color] || '000'
    _openTags[code] = `color:#${oriColor}`
    _openTags[(parseInt(code) + 10).toString()] = `background:#${oriColor}`
  })
}

ansiHTML.reset()

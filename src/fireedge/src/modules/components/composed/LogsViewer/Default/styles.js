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
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { css, keyframes } from '@emotion/css'

const shimmerTranslate = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`

export const getStyles = ({
  palette = {},
  scale = {},
  borderWidth = {},
  borderRadius = {},
  fontSize = {},
  lineHeight = {},
  fontWeight = {},
} = {}) => ({
  logsContainer: css({
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
    flex: '1 1 0',
    minHeight: 0,
    minWidth: 0,

    borderRadius: `${borderRadius['3xl'] ?? scale[400]}px`,
    border: `${borderWidth.sm ?? 1}px solid ${palette.border?.primary}`,
    background: palette.surface?.mute,
  }),

  dateText: css({
    color: palette.text?.body,
    fontFamily: 'Courier New, monospace',
    fontSize: fontSize.body?.sm?.desktop ?? '0.875rem',
    fontWeight: fontWeight.heading?.h6?.desktop ?? 600,
    lineHeight: lineHeight.body?.sm?.desktop ?? '1.25rem',
    marginRight: `${scale[100] ?? 4}px`,
  }),

  logText: css({
    color: palette.text?.headings,
    fontFamily: 'Courier New, monospace',
    fontSize: fontSize.body?.sm?.desktop ?? '0.875rem',
    fontWeight: fontWeight.heading?.h6?.desktop ?? 600,
    lineHeight: lineHeight.body?.sm?.desktop ?? '1.25rem',
  }),

  containerText: css({
    paddingLeft: `${scale[200] ?? 8}px`,
    minHeight: `${scale[600] ?? 24}px`,
  }),

  infoLog: css({
    borderLeft: `${borderWidth.md ?? 2}px solid ${palette?.icon?.information}`,
  }),

  debugLog: css({
    borderLeft: `${borderWidth.md ?? 2}px solid ${palette?.icon?.disabled}`,
  }),

  warnLog: css({
    borderLeft: `${borderWidth.md ?? 2}px solid ${palette?.icon?.warning}`,
  }),

  errorLog: css({
    borderLeft: `${borderWidth.md ?? 2}px solid ${palette?.icon?.error}`,
  }),

  highlightText: css({
    color: palette.text?.body,
    background: palette.surface?.warning,
    padding: `0 ${scale[50] ?? 2}px`,
    borderRadius: `${borderRadius.xs ?? scale[25] ?? 1}px`,
  }),

  shimmerOverlay: css({
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    pointerEvents: 'none',
    backgroundImage: `linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%
    )`,
    animation: `${shimmerTranslate} 2.5s infinite`,
  }),
})

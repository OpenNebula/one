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

export const styles = ({ palette }) => ({
  search: css({
    gridArea: 'search',
    position: 'relative',
    borderRadius: '6.25rem',
    display: 'flex',
    alignItems: 'center',
    ...palette.searchBar.normal,
    borderWidth: '0.0625rem',
    borderStyle: 'solid',
    '&:hover': {
      ...palette.searchBar.hover,
      borderWidth: '0.0625rem',
      borderStyle: 'solid',
    },
    '&:focus-within': {
      ...palette.searchBar.focus,
      borderWidth: '0.125rem',
      borderStyle: 'solid',
    },
    padding: '1rem 1rem 1rem 1.5rem',
    width: '60%',
    marginRight: '1rem',
  }),
  searchIcon: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.searchBar.icon.color,
  }),
  inputRoot: css({
    flex: 1,
    margin: 0,
  }),
  inputInput: css({
    padding: 0,
    lineHeight: '1.25rem',
    fontWeight: 500,
    '&::-webkit-search-cancel-button': {
      cursor: 'pointer',
    },
    '&::-ms-clear': {
      cursor: 'pointer',
    },
    '&::after': {
      cursor: 'pointer',
    },
  }),
  logsContainer: css({
    background: palette.logsViewer.backgroundColor,
  }),
  dateText: css({
    color: palette.logsViewer.colorDate,
    fontFamily: 'Courier New',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '16px',
  }),
  logText: css({
    color: palette.logsViewer.colorLog,
    fontFamily: 'Courier New',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '16px',
  }),
  containerText: css({
    paddingLeft: '12px',
  }),
  infoLog: css({
    borderLeft: `3px solid ${palette.logsViewer.info.color}`,
  }),
  debugLog: css({
    borderLeft: `3px solid ${palette.logsViewer.debug.color}`,
  }),
  warnLog: css({
    borderLeft: `3px solid ${palette.logsViewer.warn.color}`,
  }),
  errorLog: css({
    borderLeft: `3px solid ${palette.logsViewer.error.color}`,
  }),
  highlightText: css({
    background: palette.logsViewer.highlight,
    padding: '0 1px',
  }),
  shimmerOverlay: css({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
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

/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { css } from '@emotion/css'

export const styles = ({ palette }) => ({
  container: css({
    flexDirection: 'column',
    gap: 2,
    mb: 2,
    mt: 2,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }),
  toolbar: css({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  }),
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
  logText: css({
    color: palette.eventsViewer.colorLog,
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '20px',
  }),
  logDate: css({
    color: palette.eventsViewer.colorDate,
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '20px',
  }),
  logTime: css({
    color: palette.eventsViewer.colorTime,
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '20px',
  }),
  action: css({
    width: '20%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
  description: css({
    width: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
  time: css({
    width: '20%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
})

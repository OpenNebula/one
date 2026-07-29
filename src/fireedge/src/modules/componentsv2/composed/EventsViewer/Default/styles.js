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

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Events viewer styles
 */
export const getStyles = ({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${theme.scale[500]}px`,
  marginBottom: `${theme.scale[200]}px`,
  marginTop: `${theme.scale[200]}px`,
  width: '100%',
  minWidth: 0,

  '& .events-searchbar': {
    width: '100%',
    minWidth: 0,

    '& > div, & .searchbar-slot': {
      height: `${theme.scale[800]}px`,
      minHeight: `${theme.scale[800]}px`,
    },

    '& .searchbar-slots': {
      alignItems: 'stretch',
      flexWrap: {
        xs: 'wrap',
        xl: 'nowrap',
      },
    },

    '& .searchbar-slots:has(.search-slot)': {
      margin: 0,
    },

    '& .events-date-filter, & .events-date-filter > div, & .datepicker-wrapper, & .react-datepicker__input-container, & .datepicker-input, & .datepicker-input .MuiFormControl-root, & .datepicker-input .MuiInput-root':
      {
        height: '100%',
      },
  },

  '& .events-table-container': {
    width: '100%',
    minWidth: 0,
  },

  '& .events-log-text': {
    color: theme.palette.eventsViewer?.colorLog,
    fontSize: theme.fontSize.body.sm.desktop,
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: theme.lineHeight.body.sm.desktop,
  },

  '& .events-log-date': {
    color: theme.palette.eventsViewer?.colorDate,
    fontSize: theme.fontSize.body.sm.desktop,
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: theme.lineHeight.body.sm.desktop,
  },

  '& .events-time-cell': {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.scale[100]}px`,
    minWidth: 0,
    whiteSpace: 'nowrap',
  },

  '& .events-time-separator': {
    color: theme.palette.eventsViewer?.colorDate,
    fontSize: theme.fontSize.body.sm.desktop,
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: theme.lineHeight.body.sm.desktop,
  },

  '& .events-highlight': {
    background: '#ffee58',
    padding: `0 ${theme.scale[50]}px`,
  },
})

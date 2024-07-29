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
import makeStyles from '@mui/styles/makeStyles'

export default makeStyles(({ palette, typography, breakpoints }) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  rootWithoutHeight: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    maxHeight: '14rem',
    marginTop: '1rem',
  },
  toolbar: {
    ...typography.body1,
    marginBottom: '1em',
    display: 'grid',
    gridTemplateRows: 'auto auto',
    gridTemplateAreas: `
      'actions actions pagination'
      'search search filters'`,
    alignItems: 'start',
    gap: '1em',
    [breakpoints.down('md')]: {
      gridTemplateAreas: `
        'actions actions actions'
        'pagination pagination pagination'
        'search search filters'`,
    },
  },
  actions: {
    gridArea: 'actions',
  },
  pagination: {
    gridArea: 'pagination',
  },
  search: {
    gridArea: 'search',
  },
  filters: {
    gridArea: 'filters',
    display: 'flex',
    alignItems: 'center',
    justifySelf: 'end',
    gap: '1em',
  },
  body: {
    overflow: 'auto',
    display: 'grid',
    gap: '1em',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridAutoRows: 'max-content',
    '& > [role=row]': {
      padding: '0.8em',
      cursor: 'pointer',
      color: palette.text.primary,
      /**
       * @param {object} props - Properties of the styles
       * @returns {object} - Background color
       */
      backgroundColor: (props) =>
        props.readOnly ? palette.action.hover : palette.background.paper,
      fontWeight: typography.fontWeightRegular,
      fontSize: '1em',
      border: `1px solid ${palette.divider}`,
      borderRadius: '0.5em',
      display: 'flex',
      gap: '1em',
      '&:hover': {
        backgroundColor: palette.action.hover,
      },
      '&.selected': {
        border: `2px solid ${palette.secondary.main}`,
      },
    },
  },
  bodyWithoutGap: {
    overflow: 'auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridAutoRows: 'max-content',
    '& > [role=row]': {
      padding: '0.8em',
      cursor: 'pointer',
      marginBottom: '1rem',
      color: palette.text.primary,
      /**
       * @param {object} props - Properties of the styles
       * @returns {object} - Background color
       */
      backgroundColor: (props) =>
        props.readOnly ? palette.action.hover : palette.background.paper,
      fontWeight: typography.fontWeightRegular,
      fontSize: '1em',
      border: `1px solid ${palette.divider}`,
      borderRadius: '0.5em',
      display: 'flex',
      '&:hover': {
        backgroundColor: palette.action.hover,
      },
      '&.selected': {
        border: `2px solid ${palette.secondary.main}`,
      },
    },
    '& > [role=row] p': {
      margin: '0rem',
    },
  },
  noDataMessage: {
    ...typography.h6,
    color: palette.text.hint,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.8em',
    padding: '1em',
  },
}))

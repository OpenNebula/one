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

export const EnhancedTableStyles = ({
  palette,
  typography,
  breakpoints,
  readOnly,
  disableGlobalActions,
  disableGlobalSort,
}) => ({
  root: css({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }),
  rootWithoutHeight: css({
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    maxHeight: '14rem',
    marginTop: '1rem',
  }),
  toolbar: css({
    ...typography.body1,
    marginBottom: '1em',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }),
  actions: css({
    gridArea: 'actions',
    display: 'flex',
    justifyContent: 'flex-start',
  }),
  pagination: css({
    gridArea: 'pagination',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  }),
  paginationArrow: css({
    minWidth: '1.5rem',
    height: '1.5rem',
    padding: '0.5rem',
  }),
  paginationText: css({
    fontSize: '0.875rem',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '1.25rem',
  }),
  toolbarContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    gap: '0.5rem',
  }),
  filters: css({
    gridArea: 'filters',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }),
  body: css({
    overflowY: 'auto',
    display: 'grid',
    gap: '1em',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridAutoRows: 'max-content',
    '& > [role=row]': {
      padding: '0.8em',
      cursor: 'pointer',
      color: palette.text.primary,
      backgroundColor: palette.tables.cards.normal.backgroundColor,
      fontWeight: typography.fontWeightRegular,
      fontSize: '1em',
      border: `1px solid ${palette.divider}`,
      borderRadius: '0.5em',
      display: 'flex',
      gap: '1em',
      '&:hover': {
        backgroundColor: palette.tables.cards.normal.hover.backgroundColor,
      },
      '&.selected': {
        backgroundColor: palette.tables.cards.pressed.backgroundColor,
        border: `.125rem solid ${palette.tables.cards.pressed.borderColor}`,
        '&:hover': {
          backgroundColor: palette.tables.cards.pressed.hover.backgroundColor,
        },
      },
    },
  }),
  noDataMessage: css({
    ...typography.h6,
    color: palette.text.hint,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.8em',
    padding: '1em',
  }),
  table: css({
    width: '100%',
    '& th:nth-of-type(1), & td:nth-of-type(1)': {
      width: '5rem',
    },
  }),
  cellHeaders: css({
    fontWeight: 'bold',
    padding: '0.5rem',
    backgroundColor: 'transparent',
    position: 'relative',
  }),
  row: css({
    '&': {
      cursor: 'pointer',
    },
    '&.selected': {
      boxShadow: `inset 0px -0.5px 0px 2px ${palette.primary.main}`,
    },
  }),
  cell: css({
    padding: '0.5rem',
  }),
  refreshIcon: css({
    ...palette.tables.refreshIcon,
  }),
})

export default EnhancedTableStyles

/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { makeStyles } from '@material-ui/core'

import { addOpacityToColor } from 'client/utils'

export default makeStyles(
  ({ palette, typography, breakpoints, shadows }) => ({
    root: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    toolbar: {
      ...typography.body1,
      marginBottom: 16,
      display: 'flex',
      gap: '1em',
      alignItems: 'start',
      justifyContent: 'space-between',
      '& > div:first-child': {
        flexGrow: 1
      }
    },
    pagination: {
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'end',
      gap: '1em'
    },
    loading: {
      transition: '200ms'
    },
    table: {
      display: 'grid',
      gridTemplateColumns: 'minmax(auto, 300px) 1fr',
      gap: 8,
      overflow: 'auto',
      [breakpoints.down('sm')]: {
        gridTemplateColumns: 'minmax(0, 1fr)'
      }
    },
    body: {
      overflow: 'auto',
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridAutoRows: 'max-content',
      paddingBlock: '0.8em',
      '& > [role=row]': {
        padding: '0.8em',
        cursor: 'pointer',
        color: palette.text.primary,
        backgroundColor: palette.background.paper,
        fontWeight: typography.fontWeightMedium,
        fontSize: '1em',
        borderRadius: 6,
        display: 'flex',
        gap: 8,
        boxShadow: shadows[1],
        '&:hover': {
          backgroundColor: palette.action.hover
        },
        '&.selected': {
          backgroundColor: addOpacityToColor(palette.secondary.main, 0.2),
          border: `2px solid ${palette.secondary.main}`
        }
      }
    },
    noDataMessage: {
      ...typography.h6,
      color: palette.text.hint,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '1em'
    }
  }))

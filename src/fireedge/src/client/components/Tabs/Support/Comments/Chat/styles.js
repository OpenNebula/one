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

export const useStyles = makeStyles((theme) => ({
  bubble: {
    border: '1px solid var(--color-neutral-4)',
    boxShadow: theme.shadows[5],
    borderRadius: theme.typography.pxToRem(12),
    margin: theme.spacing(1),
    padding: theme.spacing(1),
    width: 'fit-content',
    maxWidth: '80%',
    '& pre': {
      overflowX: 'auto',
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
  },
  messageDate: {
    textAlign: 'end',
    fontSize: theme.typography.pxToRem(12),
  },
  messageAuthor: {
    fontWeight: theme.typography.fontWeightBold,
    display: 'flex',
    alignItems: 'center',
  },
  authorImage: {
    maxHeight: theme.typography.pxToRem(24),
    maxWidth: theme.typography.pxToRem(24),
    marginRight: theme.spacing(1),
  },
  chatBox: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflowY: 'scroll',
  },
  requesterMessage: {
    alignSelf: 'flex-end',
    boxShadow: theme.shadows[5],
    backgroundColor: theme.palette.secondary[theme.palette.mode],
  },
  supportMessage: {
    alignSelf: 'flex-start',
    color: theme.palette.common.white,
    backgroundColor: theme.palette.primary[theme.palette.mode],
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  commentBar: {
    border: 'solid',
    backgroundColor: theme.palette.background.paper,
    width: '100%',
  },
}))

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

import { ReactElement, useMemo } from 'react'

import { ManageLabels } from '@ComponentsV2Module'
import { Box, useTheme } from '@mui/material'
import { css } from '@emotion/css'

const styles = ({ palette, spacing }) => ({
  labelsSection: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    paddingTop: spacing(5),
    paddingBottom: spacing(4),
    color: palette.text.body,
  }),
})

/**
 * Section to change labels.
 *
 * @returns {ReactElement} Settings configuration UI
 */
export const Settings = () => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  return (
    <>
      <Box className={classes.labelsSection}>
        <ManageLabels isEmbedded />
      </Box>
    </>
  )
}

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
import EnhancedTableStyles from '@modules/components/Tables/Enhanced/styles'
import { GlobalActions } from '@modules/components/Tables/Enhanced/Utils'
import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

const SingleDetailActions = memo(({ selectedRows = [], singleActions }) => {
  const theme = useTheme()
  const styles = useMemo(
    () =>
      EnhancedTableStyles({
        ...theme,
        readOnly: false,
      }),
    [theme]
  )

  if (!selectedRows || typeof singleActions !== 'function') {
    return null
  }

  const parsedSelectedRows = [{ original: selectedRows }]
  const actions = singleActions({ selectedRows: parsedSelectedRows })

  return (
    <Box marginBottom={2}>
      <GlobalActions
        className={styles.actions}
        globalActions={actions}
        selectedRows={parsedSelectedRows}
      />
    </Box>
  )
})

SingleDetailActions.propTypes = {
  selectedRows: PropTypes.array,
  actions: PropTypes.array,
}
SingleDetailActions.displayName = 'SingleDetailActions'
export default SingleDetailActions

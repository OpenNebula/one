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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Box, Grid, Paper, Typography } from '@mui/material'
import { Translate } from '@modules/components/HOC'
import { T, CPU_STATUS } from '@ConstantsModule'
import { getColorFromString } from '@ModelsModule'
import { PATH } from '@modules/components/path'
import { generatePath, useHistory } from 'react-router'

/**
 * @param {object} props - Props
 * @param {string} props.core - Numa core
 * @param {number} props.status - Core pin status
 * @returns {ReactElement} Information tab
 */
const NumaCoreCPU = ({ core, status }) => {
  // Generates unique colors for VM id, uses grey bg for isolated/free.
  const history = useHistory()
  const bgColor = CPU_STATUS?.[status]
    ? 'action.disabled'
    : getColorFromString(status)

  const attachedToVm = status >= 0

  const gotoVm = (id) =>
    history.push(generatePath(PATH.INSTANCE.VMS.DETAIL, { id }))

  return (
    <Grid item xs={6}>
      <Paper
        variant="outlined"
        sx={{
          color: 'text.primary',
          bgcolor: bgColor,
          padding: '0.5rem',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            gutterBottom
            variant="body2"
            component="div"
            align="center"
            noWrap
          >
            <Translate word={T.NumaNodeCPUItem} values={core} />
          </Typography>
          {attachedToVm ? (
            <Typography
              gutterBottom
              variant="body2"
              component="div"
              align="center"
              data-cy={`cpu-${core}`}
              sx={{
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              onClick={() => gotoVm(status)}
              noWrap
            >
              {`${T.VM} #${status}`}
            </Typography>
          ) : (
            <Typography
              gutterBottom
              variant="body2"
              component="div"
              align="center"
              data-cy={`cpu-${core}`}
              noWrap
            >
              {CPU_STATUS?.[status]}
            </Typography>
          )}
        </Box>
      </Paper>
    </Grid>
  )
}

NumaCoreCPU.propTypes = {
  core: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
}

NumaCoreCPU.displayName = 'NumaCoreCPU'

export default NumaCoreCPU

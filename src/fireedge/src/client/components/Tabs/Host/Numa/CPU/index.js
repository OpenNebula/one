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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Box, Grid, Paper, Typography } from '@mui/material'

import { Translate } from 'client/components/HOC'
import { T, CPU_STATUS } from 'client/constants'

/**
 * @param {object} props - Props
 * @param {string} props.core - Numa core
 * @param {object} props.cpus - List of numa cores
 * @returns {ReactElement} Information tab
 */
const NumaCoreCPU = ({ core, cpus }) => (
  <Grid item xs={6}>
    <Paper
      variant="outlined"
      sx={{
        color: 'text.primary',
        bgcolor:
          CPU_STATUS[cpus[core]] === CPU_STATUS['-2']
            ? 'action.disabled'
            : 'action.disabledBackground',
        pt: '0.3rem',
        pb: '0.1rem',
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="body2" component="div" align="center">
          <Translate word={T.NumaNodeCPUItem} values={core} />
        </Typography>
        <Typography
          gutterBottom
          variant="body2"
          component="div"
          align="center"
          data-cy={`cpu-${core}`}
        >
          {CPU_STATUS[cpus[core]]}
        </Typography>
      </Box>
    </Paper>
  </Grid>
)

NumaCoreCPU.propTypes = {
  core: PropTypes.string.isRequired,
  cpus: PropTypes.object.isRequired,
}

NumaCoreCPU.displayName = 'NumaCoreCPU'

export default NumaCoreCPU

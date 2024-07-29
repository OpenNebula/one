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
import { Box, Grid, Typography } from '@mui/material'
import PropTypes from 'prop-types'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

import NumaCoreCPU from 'client/components/Tabs/Host/Numa/CPU'

/**
 * @param {object} props - Props
 * @param {object} props.core - Numa core
 * @returns {ReactElement} Information tab
 */
const NumaCore = ({ core }) => {
  const cpus = Object.fromEntries(
    core.CPUS.split(',').map((item) => item.split(':'))
  )

  return (
    <Grid
      item
      xs={12}
      sm={6}
      md={3}
      display="flex"
      justifyContent="center"
      data-cy={`numa-core-${core.ID}`}
    >
      <Box width="200px">
        <Typography gutterBottom variant="body1" component="div" align="center">
          <Translate word={T.NumaCore} values={core.ID} />
        </Typography>
        <Grid container spacing={1}>
          {Object.keys(cpus).map((cpu, index) => (
            <NumaCoreCPU key={index} core={cpu} cpus={cpus} />
          ))}
        </Grid>
      </Box>
    </Grid>
  )
}

NumaCore.propTypes = {
  core: PropTypes.object.isRequired,
}

NumaCore.displayName = 'Core'

export default NumaCore

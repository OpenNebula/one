/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { Box, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import LinearProgressWithLabel from 'client/components/Status/LinearProgressWithLabel'

import { Tr, Translate } from 'client/components/HOC'
import { HOST_THRESHOLD, T } from 'client/constants'

import { getNumaMemory } from 'client/models/Host'

/**
 * @param {object} props - Props
 * @param {string} props.node - Numa node
 * @returns {ReactElement} Information tab
 */
const NumaMemory = ({ node }) => {
  const { percentMemUsed, percentMemLabel } = getNumaMemory(node)

  return (
    <Box>
      <Typography gutterBottom variant="subtitle1" component="h3">
        <Translate word={T.NumaNodeMemory} />
      </Typography>
      <Paper variant="outlined" sx={{ p: '1.25rem' }} data-cy="memory">
        <LinearProgressWithLabel
          value={percentMemUsed}
          label={percentMemLabel}
          title={`${Tr(T.AllocatedCpu)}`}
          high={HOST_THRESHOLD.CPU.high}
          low={HOST_THRESHOLD.CPU.low}
        />
      </Paper>
    </Box>
  )
}

NumaMemory.propTypes = {
  node: PropTypes.object.isRequired,
}

NumaMemory.displayName = 'NumaMemory'

export default NumaMemory

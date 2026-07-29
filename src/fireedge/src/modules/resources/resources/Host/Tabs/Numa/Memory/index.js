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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { useTranslation } from '@ProvidersModule'
import {
  HOST_THRESHOLD,
  T,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'
import { getNumaMemory } from '@ModelsModule'
import { ProgressBar, Text } from '@ComponentsV2Module'
import { getStyles } from '@modules/resources/resources/Host/Tabs/Numa/Memory/styles'

/**
 * @param {object} props - Props
 * @param {string} props.node - Numa node
 * @returns {ReactElement} Information tab
 */
const NumaMemory = ({ node }) => {
  const { translate } = useTranslation()
  const { percentMemUsed, percentMemLabel } = getNumaMemory(node)
  const sliderValue = Math.min(100, Math.max(0, percentMemUsed))

  return (
    <Box sx={(theme) => getStyles({ theme })} data-cy="memory">
      <Text
        className="numa-memory__title"
        component="h6"
        variant={TEXT_VARIANTS.H6}
        weight={TEXT_WEIGHTS.SEMIBOLD}
        value={translate(T.NumaNodeMemory)}
      />
      <Box className="numa-memory__content">
        <ProgressBar
          className="numa-memory__progress"
          value={Number.isFinite(sliderValue) ? sliderValue : 0}
          label={percentMemLabel}
          thresholds={[HOST_THRESHOLD.MEMORY.low, HOST_THRESHOLD.MEMORY.high]}
          isLabelVisible
        />
      </Box>
    </Box>
  )
}

NumaMemory.propTypes = {
  node: PropTypes.object.isRequired,
}

NumaMemory.displayName = 'NumaMemory'

export default NumaMemory

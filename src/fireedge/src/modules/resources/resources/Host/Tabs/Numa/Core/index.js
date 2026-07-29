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
import { ReactElement } from 'react'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { useTranslation } from '@ProvidersModule'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import NumaCoreCPU from '@modules/resources/resources/Host/Tabs/Numa/CPU'
import { getStyles } from '@modules/resources/resources/Host/Tabs/Numa/Core/styles'
import { Text } from '@ComponentsV2Module'

/**
 * @param {object} props - Props
 * @param {object} props.core - Numa core
 * @returns {ReactElement} Information tab
 */
const NumaCore = ({ core }) => {
  const { translate } = useTranslation()
  if (!core) return null

  const cpus = `${core.CPUS ?? ''}`
    .split(',')
    .filter(Boolean)
    .map((item) => {
      const [coreId, allocationStatus = -1] = item.split(':')

      return { coreId, allocationStatus }
    })

  return (
    <Box sx={(theme) => getStyles({ theme })} data-cy={`numa-core-${core.ID}`}>
      <Text
        className="numa-core__title"
        component="h6"
        variant={TEXT_VARIANTS.H6}
        weight={TEXT_WEIGHTS.SEMIBOLD}
        value={translate(T.NumaCore, core.ID)}
      />
      <Box className="numa-core__cpus">
        {cpus.map(({ coreId, allocationStatus }, index) => (
          <NumaCoreCPU
            key={`${coreId}-${index}`}
            core={coreId}
            status={allocationStatus}
          />
        ))}
      </Box>
    </Box>
  )
}

NumaCore.propTypes = {
  core: PropTypes.object.isRequired,
}

NumaCore.displayName = 'Core'

export default NumaCore

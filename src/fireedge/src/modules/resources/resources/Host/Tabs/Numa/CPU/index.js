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
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { useResourceSingleViewContext, useTranslation } from '@ProvidersModule'
import {
  RESOURCE_NAMES,
  T,
  CPU_STATUS,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
} from '@ConstantsModule'
import { getColorFromString } from '@ModelsModule'

import { getStyles } from '@modules/resources/resources/Host/Tabs/Numa/CPU/styles'
import { Text } from '@ComponentsV2Module'

/**
 * @param {object} props - Props
 * @param {string} props.core - Numa core
 * @param {number} props.status - Core pin status
 * @returns {ReactElement} Information tab
 */
const NumaCoreCPU = ({ core, status }) => {
  const { translate } = useTranslation()
  const { openResourceSingleView } = useResourceSingleViewContext()
  // Generates unique colors for VM id, uses grey bg for isolated/free.
  const isKnownStatus = !!CPU_STATUS?.[status]
  const bgColor = isKnownStatus
    ? 'surface.disabled'
    : getColorFromString(status)

  const attachedToVm = status >= 0

  return (
    <Box sx={(theme) => getStyles({ theme, bgColor, attachedToVm })}>
      <Text
        className="numa-cpu__label"
        component="div"
        variant={TEXT_VARIANTS.CAPTION}
        weight={TEXT_WEIGHTS.SEMIBOLD}
        value={translate(T.NumaNodeCPUItem, core)}
        noWrap
      />
      <Text
        className="numa-cpu__status"
        component="div"
        variant={TEXT_VARIANTS.CAPTION}
        value={attachedToVm ? `${T.VM} #${status}` : CPU_STATUS?.[status]}
        data-cy={`cpu-${core}`}
        onClick={
          attachedToVm
            ? () => openResourceSingleView(RESOURCE_NAMES.VM, status)
            : undefined
        }
        noWrap
      />
    </Box>
  )
}

NumaCoreCPU.propTypes = {
  core: PropTypes.string.isRequired,
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

NumaCoreCPU.displayName = 'NumaCoreCPU'

export default NumaCoreCPU

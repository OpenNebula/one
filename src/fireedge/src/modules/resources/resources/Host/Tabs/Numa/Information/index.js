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
import NumaCore from '@modules/resources/resources/Host/Tabs/Numa/Core'
import NumaMemory from '@modules/resources/resources/Host/Tabs/Numa/Memory'
import NumaHugepage from '@modules/resources/resources/Host/Tabs/Numa/Hugepage'
import { getStyles } from '@modules/resources/resources/Host/Tabs/Numa/Information/styles'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { Text } from '@ComponentsV2Module'

/**
 * @param {object} props - Props
 * @param {object} props.node - Numa Node
 * @returns {ReactElement} Information tab
 */
export const InformationPanel = ({ node = {} }) => {
  const { translate } = useTranslation()
  const { CORE, HUGEPAGE } = node
  const cores = [].concat(CORE ?? []).filter(Boolean)
  const hugepages = [HUGEPAGE].flat().filter(Boolean)

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="numa-node__header">
        <Text
          component="h5"
          variant={TEXT_VARIANTS.H5}
          weight={TEXT_WEIGHTS.SEMIBOLD}
          value={translate(T.NumaNodeItem, node.NODE_ID)}
        />
      </Box>
      <Box className="numa-node__metrics">
        <NumaHugepage hugepage={hugepages} />
        <NumaMemory node={node} />
      </Box>
      <Box className="numa-node__section numa-node__section--cores">
        <Text
          className="numa-node__section-title"
          component="h6"
          variant={TEXT_VARIANTS.H6}
          weight={TEXT_WEIGHTS.SEMIBOLD}
          value={translate(T.NumaNodeTitle)}
        />
        <Box className="numa-node__cores">
          {cores.map((core) => (
            <NumaCore key={core?.ID} core={core} />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

InformationPanel.propTypes = {
  node: PropTypes.object.isRequired,
}

InformationPanel.displayName = 'InformationPanel'

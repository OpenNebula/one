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
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { ReviewTable, Tag, Text } from '@ComponentsModule'
import { VmAPI } from '@FeaturesModule'
import { T, TEXT_VARIANTS } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { mirrorList, networkNics } from './helpers'

/**
 * Displays the settings and traffic sources of a mirror.
 *
 * @param {object} props - Props
 * @param {object} props.mirror - Mirror attributes
 * @param {object} props.vnet - Parent network
 * @param {Function} props.onEditConfiguration - Edit configuration handler
 * @param {Function} props.onEditTraffic - Edit traffic handler
 * @returns {object} Mirror summary
 */
export const MirrorReview = ({
  mirror = {},
  vnet = {},
  onEditConfiguration,
  onEditTraffic,
}) => {
  const { translateText } = useTranslation()
  const { data: vms = [] } = VmAPI.useGetVmsQuery({ extended: true })

  const emptyValue = (
    <Text
      variant={TEXT_VARIANTS.BODY_SMALL}
      value={T.None}
      sx={{ color: 'text.onDisabled' }}
    />
  )

  const valueOrNone = (value) =>
    value == null || value === '' ? emptyValue : value

  const sources = mirrorList(mirror.PORTS).map((port) => {
    const [vmId, nicId] = port.split(':')
    const vm = vms.find(({ ID }) => String(ID) === vmId)
    const nic = networkNics(vm, vnet.ID).find(
      ({ NIC_ID }) => String(NIC_ID) === nicId
    )

    return (
      <Box key={port}>
        <Text
          variant={TEXT_VARIANTS.BODY_SMALL}
          value={`${vm ? `${vm.NAME} (#${vmId})` : `#${vmId}`} · NIC ${nicId}`}
          sx={{ color: 'text.headings' }}
        />
        <Text
          variant={TEXT_VARIANTS.CAPTION}
          value={[
            nic?.IP || nic?.IP6 || translateText(T.MirrorNoIPAddress),
            nic?.MAC,
            port,
          ]
            .filter(Boolean)
            .join(' · ')}
          sx={{ color: 'text.onDisabled' }}
        />
      </Box>
    )
  })

  const networkRows = [
    {
      label: T.VirtualNetwork,
      value: (
        <Box display="flex" alignItems="baseline" flexWrap="wrap" gap={0.5}>
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={vnet.NAME}
            sx={{ color: 'text.headings' }}
          />
          <Text
            variant={TEXT_VARIANTS.BODY_SMALL}
            value={`#${vnet.ID}`}
            sx={{ color: 'text.onDisabled' }}
          />
        </Box>
      ),
    },
  ]

  const configurationRows = [
    { label: T.Name, value: valueOrNone(mirror.NAME) },
    {
      label: T.Type,
      value: mirror.TYPE ? <Tag title={mirror.TYPE} /> : emptyValue,
    },
    ...(mirror.TYPE === 'RSPAN'
      ? [{ label: T.MirrorOutputVLAN, value: valueOrNone(mirror.OUTPUT_VLAN) }]
      : []),
    ...(['GRE', 'ERSPAN'].includes(mirror.TYPE)
      ? [
          { label: T.MirrorRemoteIP, value: valueOrNone(mirror.REMOTE_IP) },
          { label: T.MirrorLocalIP, value: valueOrNone(mirror.LOCAL_IP) },
        ]
      : []),
    ...(mirror.TYPE === 'ERSPAN'
      ? [
          { label: T.MirrorERSPANType, value: valueOrNone(mirror.ERSPAN_TYPE) },
          { label: T.MirrorERSPANKey, value: valueOrNone(mirror.ERSPAN_KEY) },
          ...(mirror.ERSPAN_TYPE === 'II'
            ? [
                {
                  label: T.MirrorERSPANIndex,
                  value: valueOrNone(mirror.ERSPAN_INDEX),
                },
              ]
            : [
                {
                  label: T.MirrorERSPANHWID,
                  value: valueOrNone(mirror.ERSPAN_HWID),
                },
              ]),
        ]
      : []),
    { label: T.Description, value: valueOrNone(mirror.DESCRIPTION) },
  ]

  const trafficRows = [
    { label: T.Traffic, value: mirror.DIRECTION || 'BOTH' },
    {
      label: T.MirrorSourceInterfaces,
      value: sources.length ? (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {sources}
        </Box>
      ) : (
        emptyValue
      ),
    },
    {
      label: T.MirrorSourceVLANs,
      value: valueOrNone(mirrorList(mirror.VLANS).join(', ')),
    },
  ]

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <ReviewTable
        title={T.Network}
        dataCy="mirror-review-network"
        rows={networkRows}
      />
      <ReviewTable
        title={T.Configuration}
        dataCy="mirror-review-configuration"
        rows={configurationRows}
        onEdit={onEditConfiguration}
      />
      <ReviewTable
        title={T.MirrorTrafficSource}
        dataCy="mirror-review-traffic"
        rows={trafficRows}
        onEdit={onEditTraffic}
      />
    </Box>
  )
}

MirrorReview.propTypes = {
  mirror: PropTypes.object,
  vnet: PropTypes.object,
  onEditConfiguration: PropTypes.func,
  onEditTraffic: PropTypes.func,
}

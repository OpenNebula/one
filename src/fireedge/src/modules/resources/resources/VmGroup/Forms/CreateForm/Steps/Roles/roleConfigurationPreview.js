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
import { Box, Stack } from '@mui/material'
import { Cancel, InfoEmpty } from 'iconoir-react'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { AlertNotification, Button, Tooltip } from '@ComponentsV2Module'

const POLICY_LABELS = {
  AFFINED: T.Affined,
  ANTI_AFFINED: T.AntiAffined,
  None: T.None,
}

/**
 * Role host affinity list preview.
 *
 * @param {object} props - Component props
 * @param {string} props.title - Section title
 * @param {string} props.emptyText - Empty state text
 * @param {string} props.emptyTooltip - Empty state tooltip
 * @param {string} props.affinityKey - Role affinity key
 * @param {Array} props.hostIds - Host IDs
 * @param {Function} props.onRemoveHost - Host remove handler
 * @returns {object} Role hosts preview
 */
const HostListPreview = ({
  title,
  emptyText,
  emptyTooltip,
  affinityKey,
  hostIds,
  onRemoveHost,
}) => {
  const { translate } = useTranslation()

  return (
    <Stack gap={1}>
      <Box sx={{ color: 'text.secondary', fontWeight: 600 }}>{title}:</Box>
      {hostIds?.length > 0 ? (
        <Stack gap={1} sx={{ alignItems: 'flex-start' }}>
          {hostIds.map((hostId) => (
            <Box
              key={`${affinityKey}-${hostId}`}
              sx={{
                alignItems: 'center',
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: 'minmax(8rem, max-content) 2rem',
              }}
            >
              <Box>
                {translate(T.Host)} {hostId}
              </Box>
              <Button
                aria-label="remove"
                iconOnly={<Cancel />}
                isDestructive
                onClick={() => onRemoveHost(affinityKey, hostId)}
                size="small"
                type="transparent"
              />
            </Box>
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            alignItems: 'center',
            color: 'text.secondary',
            display: 'flex',
          }}
        >
          {emptyText}
          <Tooltip title={emptyTooltip}>
            <Box component="span" sx={{ display: 'inline-flex', ml: 0.5 }}>
              <InfoEmpty width="16px" height="16px" />
            </Box>
          </Tooltip>
        </Box>
      )}
    </Stack>
  )
}

HostListPreview.propTypes = {
  title: PropTypes.string,
  emptyText: PropTypes.string,
  emptyTooltip: PropTypes.string,
  affinityKey: PropTypes.string,
  hostIds: PropTypes.array,
  onRemoveHost: PropTypes.func,
}

/**
 * Preview of the selected VM Group role configuration.
 *
 * @param {object} props - Component props
 * @param {object} props.role - Selected role
 * @param {number} props.selectedRoleIndex - Selected role index
 * @param {Function} props.onRemoveHost - Host remove handler
 * @returns {object} Role configuration preview
 */
const RoleConfigurationPreview = ({
  role = {},
  selectedRoleIndex,
  onRemoveHost,
}) => {
  const { translate } = useTranslation()
  const title = `#${(selectedRoleIndex ?? 0) + 1} ${translate(
    T.RoleConfiguration
  )}`
  const name = role?.NAME || translate(T.RoleEnterName)
  const policy = translate(POLICY_LABELS[role?.POLICY] ?? T.None)
  const affinedHosts = [].concat(role?.HOST_AFFINED ?? [])
  const antiAffinedHosts = [].concat(role?.HOST_ANTI_AFFINED ?? [])

  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      <AlertNotification
        type="primary"
        status="information"
        title={title}
        isDismissible={false}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      <Stack gap={2} data-cy="role-configuration-preview">
        <Box>
          <strong>{translate(T.Name)}:</strong> {name}
        </Box>
        <Box>
          <strong>{translate(T.Policy)}:</strong> {policy}
        </Box>
        <HostListPreview
          title={translate(T.AffinedHosts)}
          emptyText={translate(T.NoAffinedHosts)}
          emptyTooltip={translate(T.NoAffinedHostsConcept)}
          affinityKey="HOST_AFFINED"
          hostIds={affinedHosts}
          onRemoveHost={onRemoveHost}
        />
        <HostListPreview
          title={translate(T.AntiAffinedHosts)}
          emptyText={translate(T.NoAntiAffinedHosts)}
          emptyTooltip={translate(T.NoAntiAffinedHostsConcept)}
          affinityKey="HOST_ANTI_AFFINED"
          hostIds={antiAffinedHosts}
          onRemoveHost={onRemoveHost}
        />
      </Stack>
    </Box>
  )
}

RoleConfigurationPreview.propTypes = {
  role: PropTypes.shape({
    NAME: PropTypes.string,
    POLICY: PropTypes.string,
    HOST_AFFINED: PropTypes.array,
    HOST_ANTI_AFFINED: PropTypes.array,
  }),
  selectedRoleIndex: PropTypes.number,
  onRemoveHost: PropTypes.func,
}

export default RoleConfigurationPreview

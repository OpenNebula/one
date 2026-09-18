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
import { Component, useMemo } from 'react'
import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
  TablePanel,
  TagList,
} from '@ComponentsModule'
import { Box } from '@mui/material'
import { MoreVert, Plus as AddIcon } from 'iconoir-react'
import { STYLE_BUTTONS, T, VROUTER_ACTIONS } from '@ConstantsModule'
import { useGeneralApi, useModalsApi, VrAPI } from '@FeaturesModule'
import { getVirtualRouterNics } from '@ModelsModule'
import { jsonToXml } from '@UtilsModule'
import { AttachNicForm } from '@modules/resources/VirtualRouter/Forms'

const NIC_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'NIC_ID', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  { header: T.Network, id: 'network', accessorKey: 'NETWORK', truncate: true },
  {
    header: `${T.Network} ${T.ID}`,
    id: 'network-id',
    accessorKey: 'NETWORK_ID',
    grow: false,
  },
  {
    header: `${T.AddressRange} ${T.ID}`,
    id: 'ar-id',
    accessorKey: 'AR_ID',
    grow: false,
  },
  {
    header: T.ip,
    id: 'ip',
    accessorKey: 'IP',
    meta: { disableCellTooltip: true },
    cell: ({ row }) =>
      row.original?.IP ? <TagList tags={[{ title: row.original.IP }]} /> : '-',
  },
  {
    header: 'IPv6',
    id: 'ip6',
    accessorKey: 'IP6',
    meta: { disableCellTooltip: true },
    cell: ({ row }) =>
      row.original?.IP6 ? (
        <TagList tags={[{ title: row.original.IP6 }]} />
      ) : (
        '-'
      ),
  },
  { header: T.MAC, id: 'mac', accessorKey: 'MAC' },
  {
    header: T.VirtualRouterNICFloatingIP,
    id: 'floating',
    accessorKey: 'FLOATING_IP',
  },
  {
    header: T['nic.card.management'],
    id: 'management',
    accessorKey: 'VROUTER_MANAGEMENT',
  },
]

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Virtual Router NICs tab
 */
export const Nics = ({ data, config }) => {
  const { vrouter = {}, isActionsDisabled, isLocked } = data || {}
  const { enqueueSuccess } = useGeneralApi()
  const { showModal } = useModalsApi()
  const [attachNic, { isLoading: isAttachingNic }] =
    VrAPI.useAttachNicVrMutation()
  const [detachNic, { isLoading: isDetachingNic }] =
    VrAPI.useDetachNicVrMutation()
  const nics = useMemo(() => getVirtualRouterNics(vrouter), [vrouter])
  const actions = config?.actions ?? {}
  const canAttachNic = actions[VROUTER_ACTIONS.ATTACH_NIC] === true
  const canDetachNic = actions[VROUTER_ACTIONS.DETACH_NIC] === true
  const areActionsDisabled =
    isActionsDisabled || isLocked || isAttachingNic || isDetachingNic

  const handleAttachNic = async (nic) => {
    const result = await attachNic({
      id: vrouter?.ID,
      template: jsonToXml({ NIC: nic }),
    })

    if (result?.error) return false
    enqueueSuccess(T.AttachVRouterNicSuccess, [vrouter?.ID])
  }

  const handleDetachNic = (nic) => async () => {
    const result = await detachNic({ id: vrouter?.ID, nic: nic?.NIC_ID })

    if (result?.error) return false
    enqueueSuccess(T.DetachVRouterNicSuccess, [vrouter?.ID])
  }

  const openAttachNicForm = () =>
    showModal({
      name: T.AttachNic,
      isFormDialog: true,
      dialogProps: {
        title: T.AttachNic,
        dataCy: 'modal-attach-nic',
        steps: AttachNicForm,
      },
      onSubmit: handleAttachNic,
    })

  const openDetachNicConfirm = (nic) =>
    showModal({
      name: T.DETACH_NIC,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSomething} ${T.NIC} #${nic?.NIC_ID}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.detach.confirmation']}
            resources={{ ID: nic?.NIC_ID, NAME: nic?.NAME }}
            resourceType={T.NIC}
          />
        ),
        dataCy: 'modal-detach-nic',
        confirmLabel: T.Detach,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleDetachNic(nic),
    })

  const columns = [
    ...NIC_COLUMNS,
    ...(canDetachNic
      ? [
          {
            header: '',
            id: 'actions',
            grow: false,
            meta: { disableCellTooltip: true },
            cell: ({ row }) => {
              const nic = row.original

              return (
                <Box display="flex" justifyContent="flex-end">
                  <MenuButton
                    dataCy={`nic-actions-${nic?.NIC_ID}`}
                    iconOnly={<MoreVert />}
                    options={[
                      [
                        {
                          title: T.DETACH_NIC,
                          dataCy: `detach-nic-${nic?.NIC_ID}`,
                          isDestructive: true,
                          isDisabled: areActionsDisabled,
                          onClick: () => openDetachNicConfirm(nic),
                        },
                      ],
                    ]}
                  />
                </Box>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <Box display="flex" flexDirection="column" gap="1em">
      {canAttachNic && (
        <Box display="flex" justifyContent="flex-start">
          <Button
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            size="small"
            dataCy="attach-nic"
            startIcon={<AddIcon width="16px" height="16px" />}
            onClick={openAttachNicForm}
            isDisabled={areActionsDisabled}
          >
            {T.AttachNic}
          </Button>
        </Box>
      )}
      <TablePanel
        dataCy="nics"
        key="virtual-router-nics-table"
        title={T.NicDevices}
        columns={columns}
        data={nics}
        isLoading={isAttachingNic || isDetachingNic}
      />
    </Box>
  )
}

Nics.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Nics.id = 'nics'
Nics.title = T.NicDevices

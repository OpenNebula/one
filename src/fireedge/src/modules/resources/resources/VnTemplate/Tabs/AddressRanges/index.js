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
import { Box } from '@mui/material'
import { MoreVert, Plus as AddIcon } from 'iconoir-react'
import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
  TablePanel,
  Tag,
} from '@ComponentsV2Module'
import { useAddressRangeFormModal } from '@modules/resources/resources/VirtualNetwork/Forms'
import {
  RESTRICTED_ATTRIBUTES_TYPE,
  STYLE_BUTTONS,
  T,
  VN_TEMPLATE_ACTIONS,
} from '@ConstantsModule'
import { VnTemplateAPI, useModalsApi, useSystemData } from '@FeaturesModule'
import { jsonToXml } from '@UtilsModule'

const getAddressRanges = (vnTemplate) =>
  [vnTemplate?.TEMPLATE?.AR ?? []].flat().filter(Boolean)

const getRange = (start, end) => [start, end].filter(Boolean).join(' | ') || '-'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VN Templates address ranges tab
 */
export const AddressRanges = ({ data, config }) => {
  const {
    vnTemplate = {},
    handleRefresh,
    isLoadingVnTemplate,
    isActionsDisabled,
    isLocked,
  } = data || {}

  // API
  const { showModal } = useModalsApi()
  const openAddressRangeForm = useAddressRangeFormModal()
  const { oneConfig, adminGroup } = useSystemData()
  const [update, { isLoading: isUpdating }] =
    VnTemplateAPI.useUpdateVNTemplateMutation()

  // State
  const actions = config?.actions ?? {}
  const canAddAddressRange = actions[VN_TEMPLATE_ACTIONS.ADD_AR] === true
  const canUpdateAddressRange = actions[VN_TEMPLATE_ACTIONS.UPDATE_AR] === true
  const canDeleteAddressRange = actions[VN_TEMPLATE_ACTIONS.DELETE_AR] === true
  const areRowActionsDisabled = isActionsDisabled || isLocked || isUpdating
  const stepProps = useMemo(
    () => ({
      vnetId: vnTemplate?.ID,
      oneConfig,
      adminGroup,
      restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.VNET,
      nameParentAttribute: 'AR',
    }),
    [adminGroup, oneConfig, vnTemplate?.ID]
  )
  const addressRanges = useMemo(
    () =>
      getAddressRanges(vnTemplate).map((addressRange, index) => ({
        ...addressRange,
        INDEX: index + 1,
        POSITION: index,
      })),
    [vnTemplate]
  )

  // Actions
  const updateTemplateAddressRanges = async (nextAddressRanges) => {
    await update({
      id: vnTemplate?.ID,
      template: jsonToXml({
        ...(vnTemplate?.TEMPLATE ?? {}),
        AR: nextAddressRanges,
      }),
    }).unwrap()
    await handleRefresh?.()
  }

  const handleAddAddressRange = (value) =>
    updateTemplateAddressRanges([...getAddressRanges(vnTemplate), value])

  const handleUpdateAddressRange = (value, index) =>
    updateTemplateAddressRanges(
      getAddressRanges(vnTemplate).map((addressRange, arIndex) =>
        arIndex === index ? value : addressRange
      )
    )

  const handleDeleteAddressRange = (index) =>
    updateTemplateAddressRanges(
      getAddressRanges(vnTemplate).filter((_, arIndex) => arIndex !== index)
    )

  // Modals
  const handleAddRangeForm = () =>
    openAddressRangeForm({
      title: T.AddAddressRange,
      stepProps,
      onSubmit: handleAddAddressRange,
    })

  const handleUpdateAddressRangeForm = (addressRange, index) =>
    openAddressRangeForm({
      title: `${T.AddressRange}: #${
        addressRange?.AR_ID ?? addressRange?.INDEX
      }`,
      initialValues: addressRange,
      stepProps,
      onSubmit: (updatedAr) => handleUpdateAddressRange(updatedAr, index),
    })

  const handleDeleteAddressRangeForm = (addressRange, index) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.DeleteAddressRange,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID: addressRange?.AR_ID ?? addressRange?.INDEX }}
            resourceType={T.AddressRanges}
          />
        ),
        confirmLabel: T.Delete,
        cancelLabel: T.Cancel,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => handleDeleteAddressRange(index),
    })

  // Table
  const columns = [
    {
      id: 'id',
      header: T.ID,
      grow: false,
      cell: ({ row }) => row.original?.AR_ID ?? row.original?.INDEX,
    },
    {
      accessorKey: 'TYPE',
      header: T.Type,
      grow: false,
      cell: ({ row }) =>
        row.original?.TYPE ? (
          <Tag title={row.original.TYPE} status="default" />
        ) : (
          '-'
        ),
    },
    { accessorKey: 'SIZE', header: T.Size, grow: false },
    {
      id: 'mac',
      header: T.MAC,
      accessorFn: (row) => getRange(row?.MAC, row?.MAC_END),
      grow: false,
    },
    {
      id: 'ip',
      header: T.IP,
      accessorFn: (row) => getRange(row?.IP, row?.IP_END),
      grow: false,
    },
    {
      id: 'ip6',
      header: 'IP6',
      accessorFn: (row) => getRange(row?.IP6, row?.IP6_END),
      grow: false,
    },
    {
      id: 'ip6_global',
      header: T.IPv6GlobalPrefix,
      accessorFn: (row) => getRange(row?.IP6_GLOBAL, row?.IP6_GLOBAL_END),
      grow: false,
    },
    {
      id: 'ip6_ula',
      header: T.IPv6ULAPrefix,
      accessorFn: (row) => getRange(row?.IP6_ULA, row?.IP6_ULA_END),
      grow: false,
    },
    {
      id: 'ipam',
      header: T.IPAMDriver,
      grow: false,
      accessorFn: (row) => row?.IPAM_MAD || T.No,
      cell: ({ row }) =>
        row.original?.IPAM_MAD ? (
          <Tag title={row.original.IPAM_MAD} status="default" />
        ) : (
          T.No
        ),
    },
    {
      id: 'actions',
      header: '',
      grow: false,
      cell: ({ row }) => {
        const addressRange = row.original
        const index = addressRange?.POSITION

        return (
          <Box display="flex" justifyContent="flex-end">
            <MenuButton
              iconOnly={<MoreVert />}
              options={[
                [
                  {
                    title: T.Edit,
                    isDisabled: !canUpdateAddressRange || areRowActionsDisabled,
                    onClick: () =>
                      handleUpdateAddressRangeForm(addressRange, index),
                  },
                  {
                    title: T.Delete,
                    isDestructive: true,
                    isDisabled: !canDeleteAddressRange || areRowActionsDisabled,
                    onClick: () =>
                      handleDeleteAddressRangeForm(addressRange, index),
                  },
                ],
              ]}
            />
          </Box>
        )
      },
    },
  ]

  return (
    <Box display="flex" flexDirection="column" gap="1em">
      {canAddAddressRange && (
        <Box display="flex" justifyContent="flex-start">
          <Button
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            size="small"
            startIcon={<AddIcon width="16px" height="16px" />}
            onClick={handleAddRangeForm}
            isDisabled={isActionsDisabled || isLocked || isUpdating}
          >
            {T.AddAddressRange}
          </Button>
        </Box>
      )}
      <TablePanel
        columns={columns}
        data={addressRanges}
        isLoading={isLoadingVnTemplate}
      />
    </Box>
  )
}

AddressRanges.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

AddressRanges.id = 'address'
AddressRanges.title = T.AddressRanges

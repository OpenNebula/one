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
  ProgressBar,
  ResourceActionConfirmation,
  TablePanel,
  Tag,
} from '@ComponentsV2Module'
import { useAddressRangeFormModal } from '@modules/resources/resources/VirtualNetwork/Forms'
import {
  RESTRICTED_ATTRIBUTES_TYPE,
  STYLE_BUTTONS,
  T,
  VN_ACTIONS,
  VNET_THRESHOLD,
} from '@ConstantsModule'
import { VnAPI, useModalsApi, useSystemData } from '@FeaturesModule'
import { getARLeasesInfo } from '@ModelsModule'
import { jsonToXml } from '@UtilsModule'

const getAddressRanges = (vnet) =>
  [vnet?.AR_POOL?.AR ?? []].flat().filter(Boolean)
const getRange = (start, end) => [start, end].filter(Boolean).join(' | ') || '-'
const getFirstIP = (addressRange) =>
  [addressRange?.IP, addressRange?.IP6].filter(Boolean).join(' | ') || '-'
const getLastIP = (addressRange) =>
  [addressRange?.IP_END, addressRange?.IP6_END].filter(Boolean).join(' | ') ||
  '-'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Virtual Network address ranges tab
 */
export const AddressRanges = ({ data, config }) => {
  const {
    vnet = {},
    handleRefresh,
    isLoadingVNet,
    isActionsDisabled,
    isLocked,
  } = data || {}

  // API
  const { showModal } = useModalsApi()
  const openAddressRangeForm = useAddressRangeFormModal()
  const { oneConfig, adminGroup } = useSystemData()
  const [addAR, { isLoading: isAddingAddressRange }] =
    VnAPI.useAddRangeToVNetMutation()
  const [updateAR, { isLoading: isUpdatingAddressRange }] =
    VnAPI.useUpdateVNetRangeMutation()
  const [removeAR, { isLoading: isRemovingAddressRange }] =
    VnAPI.useRemoveRangeFromVNetMutation()

  // State
  const actions = config?.actions ?? {}
  const canAddAddressRange = actions[VN_ACTIONS.ADD_AR] === true
  const canUpdateAddressRange = actions[VN_ACTIONS.UPDATE_AR] === true
  const canDeleteAddressRange = actions[VN_ACTIONS.DELETE_AR] === true
  const areRowActionsDisabled =
    isActionsDisabled ||
    isLocked ||
    isAddingAddressRange ||
    isUpdatingAddressRange ||
    isRemovingAddressRange
  const stepProps = useMemo(
    () => ({
      vnetId: vnet?.ID,
      oneConfig,
      adminGroup,
      restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.VNET,
      nameParentAttribute: 'AR',
    }),
    [adminGroup, oneConfig, vnet?.ID]
  )

  const addressRanges = useMemo(
    () =>
      getAddressRanges(vnet).map((addressRange, index) => ({
        ...addressRange,
        INDEX: index + 1,
        POSITION: index,
      })),
    [vnet]
  )

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
      id: 'first_mac',
      header: T.FirstMAC,
      accessorFn: (row) => row?.MAC || '-',
      grow: false,
    },
    {
      id: 'last_mac',
      header: T.LastMAC,
      accessorFn: (row) => row?.MAC_END || '-',
      grow: false,
    },
    {
      id: 'first_ip',
      header: T.FirstIP,
      accessorFn: getFirstIP,
      grow: false,
    },
    {
      id: 'last_ip',
      header: T.LastIP,
      accessorFn: getLastIP,
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
      header: T.UsedLeases,
      id: 'used_leases',
      accessorKey: 'USED_LEASES',
      cell: ({ row }) => {
        const { percentOfUsed, percentLabel } = getARLeasesInfo(row.original)

        return (
          <ProgressBar
            value={percentOfUsed}
            label={percentLabel}
            isLabelVisible
            thresholds={[VNET_THRESHOLD.LEASES.low, VNET_THRESHOLD.LEASES.high]}
          />
        )
      },
    },
    {
      id: 'actions',
      header: '',
      grow: false,
      cell: ({ row }) => {
        const addressRange = row.original
        const index = addressRange?.POSITION
        const addressRangeId = addressRange?.AR_ID ?? index

        return (
          <Box
            data-cy={`ar-actions-${addressRangeId}`}
            display="flex"
            justifyContent="flex-end"
          >
            <MenuButton
              iconOnly={<MoreVert />}
              options={[
                [
                  {
                    title: T.Edit,
                    dataCy: `update_ar-${addressRangeId}`,
                    isDisabled: !canUpdateAddressRange || areRowActionsDisabled,
                    onClick: () =>
                      handleUpdateAddressRangeForm(addressRange, index),
                  },
                  {
                    title: T.Delete,
                    dataCy: `delete_ar-${addressRangeId}`,
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

  // Actions
  const handleAddAddressRange = async (formData) => {
    const template = jsonToXml({ AR: formData })

    await addAR({ id: vnet?.ID, template }).unwrap()
    await handleRefresh?.()
  }

  const handleUpdateAddressRange = async (formData, addressRange) => {
    const template = jsonToXml({
      AR: {
        AR_ID: addressRange?.AR_ID,
        ...formData,
      },
    })

    await updateAR({ id: vnet?.ID, template }).unwrap()
    await handleRefresh?.()
  }

  const handleDeleteAddressRange = async (addressRange) => {
    await removeAR({ id: vnet?.ID, address: addressRange?.AR_ID }).unwrap()
    await handleRefresh?.()
  }

  // Modals
  const handleAddRangeForm = () =>
    openAddressRangeForm({
      title: T.AddAddressRange,
      stepProps,
      onSubmit: handleAddAddressRange,
    })

  const handleUpdateAddressRangeForm = (addressRange) =>
    openAddressRangeForm({
      title: `${T.AddressRange}: #${
        addressRange?.AR_ID ?? addressRange?.INDEX
      }`,
      initialValues: addressRange,
      stepProps: {
        ...stepProps,
        isUpdate: true,
        hasLease: +addressRange?.USED_LEASES > 0,
      },
      onSubmit: (updatedAr) =>
        handleUpdateAddressRange(updatedAr, addressRange),
    })

  const handleDeleteAddressRangeForm = (addressRange) =>
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
      onSubmit: () => handleDeleteAddressRange(addressRange),
    })

  return (
    <Box display="flex" flexDirection="column" gap="1em">
      {canAddAddressRange && (
        <Box display="flex" justifyContent="flex-start">
          <Button
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            size="small"
            dataCy="add-ar"
            startIcon={<AddIcon width="16px" height="16px" />}
            onClick={handleAddRangeForm}
            isDisabled={areRowActionsDisabled}
          >
            {T.AddAddressRange}
          </Button>
        </Box>
      )}
      <TablePanel
        dataCy="ar"
        key="virtual-network-address-ranges-table"
        columns={columns}
        data={addressRanges}
        isLoading={isLoadingVNet}
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

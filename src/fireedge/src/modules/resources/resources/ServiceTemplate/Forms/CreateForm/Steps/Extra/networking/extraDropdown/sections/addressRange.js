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
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable react/prop-types */

import { useFieldArray } from 'react-hook-form'
import { Stack } from '@mui/material'
import {
  Edit as EditIcon,
  Plus as AddIcon,
  Trash as TrashIcon,
} from 'iconoir-react'
import { AddRangeForm } from '@modules/resources/resources/VirtualNetwork/Forms'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra'

import { SECTION_ID as EXTRA_SECTION_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking/extraDropdown'
import { useModalsApi } from '@FeaturesModule'
import { Translate } from '@ProvidersModule'
import {
  RESTRICTED_ATTRIBUTES_TYPE,
  STYLE_BUTTONS,
  T,
  VNET_THRESHOLD,
  VN_ACTIONS,
} from '@ConstantsModule'
import { getARLeasesInfo } from '@ModelsModule'
import {
  ProgressBar,
  ResourceActionConfirmation,
  SubmitButton,
  Table,
  Tag,
} from '@ComponentsV2Module'

const SECTION_ID = 'AR'
const FORM_DIALOG_SIZE = {
  dialogWidth: {
    xs: 'calc(100vw - 32px)',
    md: '960px',
  },
  dialogMaxWidth: 'calc(100vw - 32px)',
}

const getRange = (start, end) => [start, end].filter(Boolean).join(' | ') || '-'
const getFirstIP = (addressRange) =>
  [addressRange?.IP, addressRange?.IP6].filter(Boolean).join(' | ') || '-'
const getLastIP = (addressRange) =>
  [addressRange?.IP_END, addressRange?.IP6_END].filter(Boolean).join(' | ') ||
  '-'

const AddressRanges = ({ selectedNetwork }) => {
  const { showModal } = useModalsApi()

  const {
    fields: addressRanges,
    remove,
    append,
    update,
  } = useFieldArray({
    name: `${EXTRA_ID}.${EXTRA_SECTION_ID}.${selectedNetwork}.${SECTION_ID}`,
  })

  const handleSubmit = (data) => append(data)
  const handleUpdate = (idx, data) => update(idx, data)
  const handleRemove = (idx) => remove(idx)

  const getFormConfig = (initialValues) => ({
    initialValues,
    stepProps: {
      restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.VNET,
      nameParentAttribute: 'AR',
    },
  })

  const handleOpenAddForm = () =>
    showModal({
      id: `add-network-address-range-${selectedNetwork}`,
      dialogProps: {
        title: T.AddressRange,
        dataCy: 'modal-add-ar',
        ...FORM_DIALOG_SIZE,
      },
      onSubmit: handleSubmit,
      form: AddRangeForm(getFormConfig()),
    })

  const handleOpenUpdateForm = (idx, ar) =>
    showModal({
      id: `update-network-address-range-${selectedNetwork}-${idx}`,
      dialogProps: {
        title: (
          <>
            <Translate word={T.AddressRange} />: #{idx}
          </>
        ),
        dataCy: 'modal-update-ar',
        ...FORM_DIALOG_SIZE,
      },
      onSubmit: (updatedAr) => handleUpdate(idx, updatedAr),
      form: AddRangeForm(getFormConfig({ ...ar, AR_ID: idx })),
    })

  const handleOpenDeleteForm = (idx) =>
    showModal({
      id: `delete-network-address-range-${selectedNetwork}-${idx}`,
      isConfirmDialog: true,
      dialogProps: {
        title: (
          <>
            <Translate word={T.DeleteAddressRange} />: #{idx}
          </>
        ),
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID: idx }}
            resourceType={T.AddressRanges}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => handleRemove(idx),
    })

  const columns = [
    {
      id: 'id',
      header: T.ID,
      grow: false,
      cell: ({ row }) => row.original?.AR_ID ?? row.original?.INDEX ?? '-',
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
    },
    {
      id: 'ip6_ula',
      header: T.IPv6ULAPrefix,
      accessorFn: (row) => getRange(row?.IP6_ULA, row?.IP6_ULA_END),
    },
    {
      id: 'ipam',
      header: T.IPAMDriver,
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
      header: '',
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        const idx = row.original?.INDEX

        return (
          <Stack direction="row" justifyContent="flex-end" gap={0.5}>
            <SubmitButton
              data-cy={`${VN_ACTIONS.UPDATE_AR}-${idx}`}
              iconOnly={<EditIcon />}
              tooltip={T.Edit}
              type={STYLE_BUTTONS.TYPE.TRANSPARENT}
              onClick={() => handleOpenUpdateForm(idx, row.original)}
            />
            <SubmitButton
              data-cy={`${VN_ACTIONS.DELETE_AR}-${idx}`}
              iconOnly={<TrashIcon />}
              tooltip={T.DeleteAddressRange}
              type={STYLE_BUTTONS.TYPE.TRANSPARENT}
              isDestructive
              onClick={() => handleOpenDeleteForm(idx)}
            />
          </Stack>
        )
      },
    },
  ]

  const addressRangeRows = addressRanges?.map((ar, idx) => ({
    ...ar,
    INDEX: idx,
  }))

  return (
    <Stack direction="column" spacing={2}>
      <SubmitButton
        data-cy={'add-ar'}
        startIcon={<AddIcon />}
        label={T.AddressRange}
        type={STYLE_BUTTONS.TYPE.SECONDARY}
        onClick={handleOpenAddForm}
      />
      <Table
        columns={columns}
        data={addressRangeRows}
        getRowId={(row) => `${row.INDEX}`}
        isDisablePagination
        isRowsSelectable={false}
        onRowClick={() => undefined}
      />
    </Stack>
  )
}

export const AR = {
  Section: AddressRanges,
  id: SECTION_ID,
}

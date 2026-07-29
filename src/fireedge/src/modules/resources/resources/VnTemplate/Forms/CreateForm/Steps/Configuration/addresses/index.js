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
import { Stack } from '@mui/material'
import { Menu as AddressesIcon, MoreVert, Plus as AddIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useMemo } from 'react'
import { useFieldArray } from 'react-hook-form'

import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
  TablePanel,
  Tag,
} from '@ComponentsV2Module'
import { useModalsApi } from '@FeaturesModule'

import { mapNameByIndex } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/addresses/schema'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'
import { ORIGINAL_ADDRESS_RANGE } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/utils'
import { useAddressRangeFormModal } from '@modules/resources/resources/VirtualNetwork/Forms'
import { RESTRICTED_ATTRIBUTES_TYPE, STYLE_BUTTONS, T } from '@ConstantsModule'

export const TAB_ID = 'AR'

const mapNameFunction = mapNameByIndex('AR')
const getRange = (start, end) => [start, end].filter(Boolean).join(' | ') || '-'

const AddressesContent = ({ oneConfig, adminGroup }) => {
  const { showModal } = useModalsApi()
  const openAddressRangeForm = useAddressRangeFormModal()
  const {
    fields: addresses,
    remove,
    update,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
    keyName: 'ID',
  })

  const stepProps = useMemo(
    () => ({
      oneConfig,
      adminGroup,
      restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.VNET,
      nameParentAttribute: 'AR',
    }),
    [adminGroup, oneConfig]
  )

  const handleCreate = (action) => {
    append(mapNameFunction(action, addresses.length))
  }

  const handleUpdate = (action, index) => {
    update(index, {
      ...mapNameFunction(action, index),
      ...(addresses[index]?.[ORIGINAL_ADDRESS_RANGE] && {
        [ORIGINAL_ADDRESS_RANGE]: true,
      }),
    })
  }

  const handleOpenCreate = () => {
    openAddressRangeForm({
      title: T.AddAddressRange,
      stepProps,
      onSubmit: handleCreate,
    })
  }

  const handleOpenUpdate = (addressRange, index) => {
    openAddressRangeForm({
      title: `${T.AddressRange}: #${addressRange?.AR_ID ?? index}`,
      initialValues: addressRange,
      stepProps,
      onSubmit: (updatedAr) => handleUpdate(updatedAr, index),
    })
  }

  const handleOpenRemove = (addressRange, index) => {
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.DeleteAddressRange,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID: addressRange?.AR_ID ?? index }}
            resourceType={T.AddressRanges}
          />
        ),
        confirmLabel: T.Delete,
        cancelLabel: T.Cancel,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => remove(index),
    })
  }

  const rows = useMemo(
    () =>
      addresses?.map((addressRange, index) => ({
        ...addressRange,
        INDEX: index,
      })) ?? [],
    [addresses]
  )

  const columns = useMemo(
    () => [
      {
        id: 'id',
        header: T.ID,
        grow: false,
        cell: ({ row }) => row.original?.AR_ID ?? row.original?.INDEX,
      },
      {
        accessorKey: 'TYPE',
        header: T.Type,
        cell: ({ row }) =>
          row.original?.TYPE ? (
            <Tag title={row.original.TYPE} status="default" />
          ) : (
            '-'
          ),
      },
      { accessorKey: 'SIZE', header: T.Size },
      {
        id: 'mac',
        header: T.MAC,
        accessorFn: (row) => getRange(row?.MAC, row?.MAC_END),
      },
      {
        id: 'ip',
        header: T.IP,
        accessorFn: (row) => getRange(row?.IP, row?.IP_END),
      },
      {
        id: 'ip6',
        header: 'IP6',
        accessorFn: (row) => getRange(row?.IP6, row?.IP6_END),
      },
      {
        id: 'actions',
        header: '',
        grow: false,
        cell: ({ row }) => {
          const index = row.original?.INDEX

          return (
            <Stack direction="row" justifyContent="flex-end">
              <MenuButton
                iconOnly={<MoreVert />}
                options={[
                  [
                    {
                      title: T.Edit,
                      onClick: () => handleOpenUpdate(row.original, index),
                    },
                    {
                      title: T.Delete,
                      isDestructive: true,
                      onClick: () => handleOpenRemove(row.original, index),
                    },
                  ],
                ]}
              />
            </Stack>
          )
        },
      },
    ],
    [addresses]
  )

  return (
    <Stack gap="1em">
      <Stack direction="row">
        <Button
          type={STYLE_BUTTONS.TYPE.SECONDARY}
          htmlType="button"
          dataCy="add-ar"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          {T.AddAddressRange}
        </Button>
      </Stack>
      <TablePanel columns={columns} data={rows} />
    </Stack>
  )
}

AddressesContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

const Content = ({ oneConfig, adminGroup }) => (
  <AddressesContent oneConfig={oneConfig} adminGroup={adminGroup} />
)

Content.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {object} */
const TAB = {
  id: 'addresses',
  name: T.Addresses,
  icon: AddressesIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB

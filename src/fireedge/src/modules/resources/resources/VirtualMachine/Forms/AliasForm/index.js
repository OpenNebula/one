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
import { SCHEMA } from '@modules/resources/resources/VirtualMachine/Forms/AliasForm/schema'
import PropTypes from 'prop-types'
import { useFieldArray } from 'react-hook-form'
import { useMemo } from 'react'
import { Edit, Plus, Trash } from 'iconoir-react'
import { VmAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import { AsyncLoadForm } from '@modules/resources/HOC'
import { T } from '@ConstantsModule'
import { createForm, jsonToXml } from '@UtilsModule'
import { Box } from '@mui/material'
import {
  Button,
  CardBlock,
  EmptyContent,
  LabelSlot,
  MetadataSlot,
  ResourceActionConfirmation,
  TitleSlot,
} from '@ComponentsV2Module'
import { mapNameByIndex } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/schema'

const AttachAliasForm = (configProps) =>
  AsyncLoadForm(
    { formPath: 'VirtualMachine/Forms/AttachAliasForm' },
    configProps
  )

const formatValue = (value) =>
  value === undefined || value === null || value === '' ? '-' : String(value)

const getSharedValue = (nic) =>
  nic?.SHARED === undefined ? '-' : nic?.SHARED === 'YES' ? T.Yes : T.No

const getAliasCardName = (nic) =>
  nic?.NETWORK
    ? `${formatValue(nic?.NAME)}: ${formatValue(nic?.NETWORK)}`
    : formatValue(nic?.NAME)

const getAliasMetadata = (nic) => [
  [T.ID, formatValue(nic?.NIC_ID)],
  [T.Network, formatValue(nic?.NETWORK)],
  [T.IP, formatValue(nic?.IP)],
  ['IP6', formatValue(nic?.IP6)],
  ['IP6_GLOBAL', formatValue(nic?.IP6_GLOBAL)],
  ['IP6_ULA', formatValue(nic?.IP6_ULA)],
  [T.MAC, formatValue(nic?.MAC)],
  [T.Address, formatValue(nic?.ADDRESS)],
  [T.SecurityGroups, formatValue(nic?.SECURITY_GROUPS)],
  [T.Parent, formatValue(nic?.PARENT)],
  [T.Shared, getSharedValue(nic)],
]

const getAliasTags = (nic) =>
  [
    nic?.IP && [`${T.IP}: ${nic.IP}`, 'miscellaneous2'],
    nic?.IP6 && [`IP6: ${nic.IP6}`, 'miscellaneous4'],
    nic?.IP6_GLOBAL && [`IP6_GLOBAL: ${nic.IP6_GLOBAL}`, 'miscellaneous4'],
    nic?.IP6_ULA && [`IP6_ULA: ${nic.IP6_ULA}`, 'miscellaneous4'],
    nic?.MAC && [`${T.MAC}: ${nic.MAC}`, 'miscellaneous1'],
    nic?.ADDRESS && [`${T.Address}: ${nic.ADDRESS}`, 'miscellaneous1'],
  ].filter(Boolean)

const AliasCard = ({ actions, alias }) => {
  const tags = getAliasTags(alias)
  const slots = [
    [TitleSlot, { title: getAliasCardName(alias) }],
    [MetadataSlot, { labels: getAliasMetadata(alias) }],
    tags.length > 0 && [LabelSlot, { labels: tags }],
  ].filter(Boolean)

  return (
    <CardBlock
      actions={actions}
      isSelectable={false}
      slots={slots}
      sx={{
        minHeight: 148,
      }}
    />
  )
}

AliasCard.propTypes = {
  actions: PropTypes.array,
  alias: PropTypes.object,
}

const Content = ({ parent, methods, vmId }) => {
  // Define method to create alias name
  const mapAliasNameFunction = mapNameByIndex('ALIAS')

  // Use array field form
  const {
    fields: alias,
    append,
    remove,
    update,
  } = useFieldArray({ name: 'ALIAS' })

  // General api for enqueue
  const { enqueueSuccess, setFieldPath, setModifiedFields } = useGeneralApi()
  const { showModal } = useModalsApi()

  // API to attach and detach alias
  const [attachAlias] = VmAPI.useAttachNicMutation()
  const [detachAlias] = VmAPI.useDetachNicMutation()

  // Handle actions on NIC and alias
  const handleAttach = async (formData) =>
    await attachAlias({
      id: vmId,
      template: jsonToXml({ NIC_ALIAS: formData }),
    })
  const handleDetach = async (nicId) =>
    await detachAlias({ id: vmId, nic: nicId })

  const handleAppend = async (data) => {
    // Set parent
    const dataWithParent = { ...data, PARENT: parent }

    // Create name
    const newAlias = mapAliasNameFunction(dataWithParent, alias.length)

    // If vmId exists, make request to API (we are in the network section of a virtual machine)
    if (vmId) {
      const result = await handleAttach(dataWithParent)
      if (result?.error) return false

      append(newAlias)
      enqueueSuccess(T.AttachAliasSuccess, [vmId])

      return
    }

    // Add to form (and also to the parent form to update the parent component)
    append(newAlias)
    methods && methods.append(newAlias)
    enqueueSuccess(T.SuccessVMTemplateAliasAttached, [
      getAliasCardName(newAlias),
    ])
  }

  const handleUpdate = (index) => (data) => {
    // Set parent
    const dataWithParent = { ...data, PARENT: parent }
    const updatedAlias = mapAliasNameFunction(dataWithParent, index)

    // Update form (and also to the parent form to update the parent component)
    update(index, updatedAlias)
    methods && methods.update(index, updatedAlias)
    enqueueSuccess(T.SuccessVMTemplateAliasUpdated, [
      getAliasCardName(updatedAlias),
    ])
  }

  const handleRemove = (index, nicId, item) => async () => {
    if (vmId) {
      const result = await handleDetach(nicId || index)
      if (result?.error) return false
    }

    // Set modified fields
    setFieldPath(`extra.Network.NIC_ALIAS.${index}`)
    setModifiedFields({ __flag__: 'DELETE' })

    // Remove form (and also to the parent form to update the parent component)
    remove(index)
    methods && methods.remove(index)

    enqueueSuccess(
      vmId ? T.DetachAliasSuccess : T.SuccessVMTemplateAliasDetached,
      [vmId || getAliasCardName(item)]
    )
  }

  const openAttachAliasForm = (item, index) => {
    const isUpdate = item !== undefined
    setFieldPath(`extra.Network.NIC_ALIAS.${isUpdate ? index : alias.length}`)

    showModal({
      id: `vm-nic-alias-${isUpdate ? 'edit' : 'create'}-${parent}-${
        isUpdate ? index : alias.length
      }`,
      isFormDialog: true,
      dialogProps: {
        title: T.AttachAlias,
        dataCy: 'modal-attach-alias',
        steps: AttachAliasForm,
        stepProps: {
          defaultData: item,
          isAlias: true,
          nics: alias,
        },
        initialValues: item,
        update: isUpdate,
      },
      onSubmit: isUpdate ? handleUpdate(index) : handleAppend,
    })
  }

  const openDetachAliasForm = (item, index, indexNicAlias) =>
    showModal({
      id: `vm-nic-alias-detach-${parent}-${indexNicAlias}`,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSomething} ${T.Alias}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.detach.confirmation']}
            resources={{ ID: item?.NIC_ID, NAME: item?.NAME }}
            resourceType={T.Alias}
          />
        ),
        dataCy: 'modal-detach-alias',
        confirmLabel: T.Detach,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleRemove(index, item?.NIC_ID, item),
    })

  const parentAliases = useMemo(
    () =>
      alias
        ?.map(({ id, ...item }, index) => ({ id, index, item }))
        ?.filter(
          ({ item }) => parent !== undefined && item?.PARENT === parent
        ) ?? [],
    [alias, parent]
  )

  return (
    <Box
      sx={{
        minWidth: 0,
        width: '100%',
      }}
    >
      <Button
        data-cy="add-alias"
        isDisabled={!parent}
        startIcon={<Plus />}
        title={T.CreateAlias}
        type="secondary"
        onClick={() => openAttachAliasForm()}
      />
      <Box
        sx={{
          display: 'grid',
          gap: '1em',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          },
          mt: '1em',
          pb: '1em',
          width: '100%',
        }}
      >
        {parentAliases.length ? (
          parentAliases.map(({ id, index, item }, indexNicAlias) => (
            <AliasCard
              actions={[
                !vmId && {
                  title: T.Edit,
                  tooltip: T.Edit,
                  startIcon: <Edit />,
                  onClick: () => openAttachAliasForm(item, index),
                },
                {
                  title: T.Detach,
                  tooltip: T.Detach,
                  startIcon: <Trash />,
                  onClick: () =>
                    openDetachAliasForm(item, index, indexNicAlias),
                },
              ].filter(Boolean)}
              alias={item}
              key={id ?? item?.NAME ?? `${parent}-${index}`}
            />
          ))
        ) : (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <EmptyContent
              subtitle={T.AttachedAliasesWillAppearHere}
              title={T.NoAliases}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

Content.displayName = 'Content'

Content.propTypes = {
  parent: PropTypes.string,
  methods: PropTypes.object,
  vmId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

const AliasForm = createForm(SCHEMA, undefined, {
  ContentForm: Content,
})

export default AliasForm

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
import { ServerConnection as NetworkIcon } from 'iconoir-react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { useEffect, useMemo } from 'react'

import {
  Button,
  CardBlock,
  EmptyContent,
  FormWithSchema,
  LabelSlot,
  Legend,
  MetadataSlot,
  ResourceActionConfirmation,
  TitleSlot,
} from '@ComponentsV2Module'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/schema'
import {
  BOOT_ORDER_NAME,
  reorderBootAfterRemove,
} from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/booting'
import { FIELDS } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/networking/schema'
import * as VirtualMachine from '@modules/resources/resources/VirtualMachine'
import { T, PCI_TYPES } from '@ConstantsModule'
import { useGeneralApi, useModalsApi } from '@FeaturesModule'
import { hasRestrictedAttributes, stringToBoolean } from '@UtilsModule'

export const TAB_ID = ['NIC', 'NIC_ALIAS', 'PCI']

const mapNicNameFunction = mapNameByIndex(TAB_ID[0])
const mapPCINameFunction = mapNameByIndex(TAB_ID[2])

const formatValue = (value) =>
  value === undefined || value === null || value === '' ? '-' : String(value)

const isPciNic = (nic) => nic?.PCI_ID !== undefined || nic?.TYPE === 'NIC'
const isAdditionalIp = (nic) =>
  nic?.NIC_ID === undefined || nic?.NETWORK === 'Additional IP'

const getNicCardName = (nic) =>
  nic?.NETWORK
    ? `${formatValue(nic?.NAME)}: ${formatValue(nic?.NETWORK)}`
    : formatValue(nic?.NAME)

const getNicDataCyId = (nic) => nic?.NIC_ID ?? nic?.NAME?.match(/\d+$/)?.[0]

const getSharedValue = (nic) =>
  nic?.SHARED === undefined ? '-' : nic?.SHARED === 'YES' ? T.Yes : T.No

const getNicMetadata = (nic) => [
  [T.ID, formatValue(nic?.NIC_ID)],
  [T.Network, formatValue(nic?.NETWORK)],
  [T.IP, formatValue(nic?.IP)],
  ['IP6', formatValue(nic?.IP6)],
  ['IP6_GLOBAL', formatValue(nic?.IP6_GLOBAL)],
  ['IP6_ULA', formatValue(nic?.IP6_ULA)],
  [T.MAC, formatValue(nic?.MAC)],
  [T.Address, formatValue(nic?.ADDRESS)],
  [T.SecurityGroups, formatValue(nic?.SECURITY_GROUPS)],
  [T.Shared, getSharedValue(nic)],
]

const getNicTitleTags = (nic, aliasLength) =>
  [
    stringToBoolean(nic?.RDP) && [T.Rdp, 'information'],
    stringToBoolean(nic?.SSH) && [T.Ssh, 'information'],
    aliasLength > 0 && [`${T.Alias}: ${aliasLength}`, 'information'],
    isPciNic(nic) && [T.Pci, 'information'],
  ].filter(Boolean)

const getNicTags = (nic) =>
  [
    nic?.IP && [`${T.IP}: ${nic.IP}`, 'miscellaneous2'],
    nic?.IP6 && [`IP6: ${nic.IP6}`, 'miscellaneous4'],
    nic?.IP6_GLOBAL && [`IP6_GLOBAL: ${nic.IP6_GLOBAL}`, 'miscellaneous4'],
    nic?.IP6_ULA && [`IP6_ULA: ${nic.IP6_ULA}`, 'miscellaneous4'],
    nic?.MAC && [`${T.MAC}: ${nic.MAC}`, 'miscellaneous1'],
    nic?.ADDRESS && [`${T.Address}: ${nic.ADDRESS}`, 'miscellaneous1'],
  ].filter(Boolean)

const NicTitleSlot = ({ labels = [], title }) => (
  <Box
    sx={(theme) => ({
      alignItems: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      flexWrap: 'wrap',
      gap: `${theme.scale[100]}px`,
      maxWidth: '100%',
    })}
  >
    <TitleSlot title={title} />
    {labels.length > 0 && <LabelSlot labels={labels} />}
  </Box>
)

NicTitleSlot.propTypes = {
  labels: PropTypes.array,
  title: PropTypes.string,
}

const NetworkingNicCard = ({ actions, aliasLength, nic }) => {
  const tags = getNicTags(nic)
  const slots = [
    [
      NicTitleSlot,
      {
        labels: getNicTitleTags(nic, aliasLength),
        title: getNicCardName(nic),
      },
    ],
    [MetadataSlot, { labels: getNicMetadata(nic) }],
    tags.length > 0 && [LabelSlot, { labels: tags }],
  ].filter(Boolean)

  return (
    <CardBlock
      actions={actions}
      dataCy={`nic-${getNicDataCyId(nic)}`}
      isSelectable={false}
      slots={slots}
    />
  )
}

NetworkingNicCard.propTypes = {
  actions: PropTypes.array,
  aliasLength: PropTypes.number,
  nic: PropTypes.object,
}

const Networking = ({ hypervisor, oneConfig, adminGroup }) => {
  const {
    enqueueSuccess,
    setModifiedFields,
    setFieldPath,
    initModifiedFields,
    changePositionModifiedFields,
  } = useGeneralApi()
  const { showModal } = useModalsApi()
  const { setValue, getValues } = useFormContext()

  const {
    fields: nics = [],
    replace: replaceNic,
    update: updateNic,
    append: appendNic,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[0]}`,
  })

  const methods = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[1]}`,
  })

  const { fields: alias = [], update: updateAlias } = methods

  const {
    fields: pcis = [],
    replace: replacePCI,
    update: updatePCI,
    append: appendPCI,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[2]}`,
  })

  useEffect(() => {
    // Init nic modified fields
    setFieldPath(`extra.Network.NIC`)
    initModifiedFields([...nics.map((_, index) => ({ __nicIndex__: index }))])

    // Init alias modified fields
    setFieldPath(`extra.Network.NIC_ALIAS`)
    initModifiedFields([
      ...alias.map((_, index) => ({ __aliasIndex__: index })),
    ])

    // Init pci modified fields
    setFieldPath(`extra.PciDevices.PCI`)
    initModifiedFields([...pcis.map((_, index) => ({ __aliasPci__: index }))])

    // Set field to network
    setFieldPath(`extra.Network`)
  }, [])

  const cardNics = useMemo(
    () =>
      [...nics, ...pcis.filter((pci) => pci?.TYPE === 'NIC')]?.map(
        ({ id, ...item }, index) => ({
          ...item,
          id,
          NIC_ID: index,
        })
      ) ?? [],
    [nics, pcis]
  )

  const notifyNicSuccess = (message, nic) =>
    setTimeout(() => enqueueSuccess(message, [getNicCardName(nic)]), 0)

  /**
   * Remove a nic and reorder the array of nics or pcis. Also, update boot order and parent attribute in alias list.
   *
   * @param {object} nic - Nic to delete
   * @param {string} idNic - Id of the nic in the array
   * @param {boolean} notify - Show success notification
   */
  const removeAndReorder = (nic, idNic, notify = true) => {
    // Get nic name and if it is pci
    const nicName = nic?.NAME
    const isPCI = nic?.TYPE === 'NIC'

    let list
    let mapFunction

    if (isPCI) {
      // Select list and map name function with pci type
      list = pcis
      mapFunction = mapPCINameFunction

      // Find the id of the nic in pci array
      const indexRemove = list.findIndex((nicPci) => nicPci.id === idNic)

      // Set field path on the index of pci array to set delete flag in this element
      setFieldPath(`extra.PciDevices.PCI.${indexRemove}`)
    } else {
      // Select list and map name function with nic type
      list = nics
      mapFunction = mapNicNameFunction

      // Find the id of the nic in nics array
      const indexRemove = list.findIndex(
        (nicNetwork) => nicNetwork.id === idNic
      )

      // Set field path on the index of nics array to set delete flag in this element
      setFieldPath(`extra.Network.NIC.${indexRemove}`)
    }

    // Set delete flag in modified fields
    setModifiedFields({ __flag__: 'DELETE' })

    // Update list selected (nics, alias or pcis) names. Names are based on index, so the names of the list elements are calculated and updated
    const updatedList = list
      .filter(({ id }) => idNic !== id)
      .map((itemNic, indexNicUpdated) => {
        const nicUpdated = mapFunction(itemNic, indexNicUpdated)

        // Update alias with new name of the NICs
        alias.forEach((itemAlias, indexItemAlias) => {
          if (itemAlias.PARENT === itemNic.NAME) {
            setFieldPath(`extra.Network.NIC_ALIAS.${indexItemAlias}`)
            setModifiedFields({ PARENT: true })
            itemAlias.PARENT = nicUpdated.NAME
            updateAlias(indexItemAlias, itemAlias)
          }
        })

        return nicUpdated
      })

    // Update boot order of booting section (boot order has disks and nics, so if we delete a nic, we need to update it)
    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(
      nicName,
      list,
      currentBootOrder
    )

    // Set modifiedFields with boout order to update it
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)

    // Replace the list (nics or pcis) with the new values after delete the element
    if (isPCI) {
      replacePCI(updatedList)
    } else {
      replaceNic(updatedList)
    }

    notify && notifyNicSuccess(T.SuccessVMTemplateNicDetached, nic)
  }

  /**
   * Update a nic with the different cases that could be because nics and pcis are on different array forms.
   *
   * @param {object} updatedNic - The nic to update
   * @param {string} id - The id of the nic in the array form
   * @param {object} nicForDelete - Nic to delete if user changes nic or pci
   * @returns {void} - Void value
   */
  const handleUpdate = (updatedNic, id, nicForDelete) => {
    // Check if the nic is pci
    const isPCI = Object.values(PCI_TYPES).includes(updatedNic?.PCI_TYPE)

    if (isPCI) {
      // Get the index of the pci in the pci array
      const indexPci = pcis.findIndex((nic) => nic.id === id)

      // If the index is equal to -1, that's mean that it's an element that before is not a pci, but in this update, user change this element from nic type to pci.
      // In this case, we need to delete the old element (that is on nics array) and add to the pci arrays.
      if (indexPci === -1) {
        // Check if the old element is in nic array and get the index
        const indexNic = nics.findIndex((nic) => nic.id === id)

        // If the old element it's on nics array, we need to get the state (if it was deleted or updated) of the element from Network.NIC of modifiedFields and set on Network.PCI of modifiedFields
        if (indexNic !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.Network.NIC',
            sourcePosition: indexNic,
            targetPath: 'extra.PciDevices.PCI',
            targetPosition: pcis.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })
        }

        // Remove the old element
        removeAndReorder(nicForDelete, id, false)

        // Add the new element
        handleAppend(updatedNic, true)
        notifyNicSuccess(T.SuccessVMTemplateNicUpdated, updatedNic)

        return
      }

      // Update if the pci exists on pcis array
      updatedNic.TYPE = 'NIC'
      setFieldPath(`extra.PciDevices.PCI.${indexPci}`)
      setModifiedFields({
        advanced: {
          PCI_TYPE: { __delete__: true },
          PCI_ADDRESS: { __delete__: true },
          PCI_SELECTION_MODE: { __delete__: true },
        },
      })
      updatePCI(indexPci, mapPCINameFunction(updatedNic, indexPci))
    } else {
      // Get the index of the nic in the nics array
      const indexNic = nics.findIndex((nic) => nic.id === id)

      // If the index is equal to -1, that's mean that it's an element that before is not a nic, but in this update, user change this element from pci type to nic.
      // In this case, we need to delete the old element (that is on pcis array) and add to the nic arrays.
      if (indexNic === -1) {
        // Check if the old element is in pcis array and get the index
        const indexPci = pcis.findIndex((nic) => nic.id === id)

        // If the old element it's on pcis array, we need to get the state (if it was deleted or updated) of the element from Network.PCI of moodifiedFields and set on Network.NIC of modifiedFields
        if (indexPci !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.PciDevices.PCI',
            sourcePosition: indexPci,
            targetPath: 'extra.Network.NIC',
            targetPosition: nics.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })

          // If the element was pci, delete the pci fields
          setFieldPath(`extra.Network.NIC.${nics.length}`)
          setModifiedFields({
            advanced: {
              TYPE: { __delete__: true },
              PCI_TYPE: { __delete__: true },
              PCI_ADDRESS: { __delete__: true },
              PCI_SELECTION_MODE: { __delete__: true },
              SHORT_ADDRESS: { __delete__: true },
              DEVICE: { __delete__: true },
              CLASS: { __delete__: true },
              VENDOR: { __delete__: true },
            },
          })
        }

        // Remove the old element
        removeAndReorder(nicForDelete, id, false)

        // Add the new element
        handleAppend(updatedNic, true)
        notifyNicSuccess(T.SuccessVMTemplateNicUpdated, updatedNic)

        return
      }

      // In case that the element has not changed from nic to pci, update on nics array
      updateNic(indexNic, mapNicNameFunction(updatedNic, indexNic))
    }

    // Always set field path on the length of nics
    setFieldPath(`extra.Network`)
    notifyNicSuccess(T.SuccessVMTemplateNicUpdated, updatedNic)
  }

  /**
   * Append a nic to the corresponding array (nics or pcis).
   *
   * @param {object} newNic - The nic to append
   * @param {boolean} update - If the append it's when user are updating a nic
   */
  const handleAppend = (newNic, update) => {
    // Check if nic is pci
    const isPCI = Object.values(PCI_TYPES).includes(newNic?.PCI_TYPE)

    if (isPCI) {
      // Set pci type as pci attribute
      newNic.TYPE = 'NIC'

      // Add the nic to the pci section in modified fields
      !update &&
        changePositionModifiedFields({
          sourcePath: 'extra.Network.NIC',
          sourcePosition: nics.length,
          targetPath: 'extra.PciDevices.PCI',
          targetPosition: pcis.length,
          sourceDelete: true,
        })
      setFieldPath(`extra.PciDevices.PCI.${pcis.length}`)
      setModifiedFields({
        advanced: {
          PCI_TYPE: { __delete__: true },
          PCI_ADDRESS: { __delete__: true },
          PCI_SELECTION_MODE: { __delete__: true },
        },
      })

      // Append to form array of pci
      const nic = mapPCINameFunction(newNic, pcis.length)
      appendPCI(nic)
      !update && notifyNicSuccess(T.SuccessVMTemplateNicAttached, nic)
    } else {
      // Set field path to last position
      setFieldPath(`extra.Network.NIC.${nics.length}`)
      setModifiedFields({
        advanced: {
          PCI_TYPE: { __delete__: true },
          PCI_ADDRESS: { __delete__: true },
          PCI_SELECTION_MODE: { __delete__: true },
        },
      })

      // Append to form array of nics
      const nic = mapNicNameFunction(newNic, nics.length)
      appendNic(nic)
      !update && notifyNicSuccess(T.SuccessVMTemplateNicAttached, nic)
    }
  }

  const getAliasLength = (nic) =>
    alias.filter((aliasItem) => aliasItem.PARENT === nic?.NAME).length

  const openAttachNicForm = () => {
    setFieldPath(`extra.Network.NIC.${nics.length}`)

    showModal({
      id: 'vm-template-networking-attach-nic',
      isFormDialog: true,
      name: T.AttachNic,
      dialogProps: {
        title: T.AttachNic,
        dataCy: 'modal-attach-nic',
        steps: VirtualMachine.Forms.AttachNicForm,
        stepProps: {
          hypervisor,
          nics,
          oneConfig,
          adminGroup,
        },
      },
      onSubmit: handleAppend,
    })
  }

  const openEditNicForm = (nic) => {
    const isPci = nic?.TYPE === 'NIC'
    const isAlias = Object.prototype.hasOwnProperty.call(nic, 'PARENT')
    const indexNic = nics.findIndex((item) => item.id === nic?.id)
    const indexPci = pcis.findIndex((item) => item.id === nic?.id)
    const title = `${T.Edit}: ${getNicCardName(nic)}`

    setFieldPath(
      isPci
        ? `extra.PciDevices.PCI.${indexPci}`
        : `extra.Network.NIC.${indexNic}`
    )

    showModal({
      id: `vm-template-networking-edit-nic-${nic?.NIC_ID}`,
      isFormDialog: true,
      name: title,
      dialogProps: {
        title,
        dataCy: 'modal-attach-nic',
        steps: VirtualMachine.Forms.AttachNicForm,
        stepProps: {
          hypervisor,
          nics,
          defaultData: nic,
          oneConfig,
          adminGroup,
          hasAlias: getAliasLength(nic) > 0,
          isPci,
          isAlias,
        },
        initialValues: nic,
        update: true,
      },
      onSubmit: (updatedNic) => {
        updatedNic.NAME = nic.NAME

        return handleUpdate(updatedNic, nic?.id, nic)
      },
    })
  }

  const openDetachNicConfirm = (nic) => {
    showModal({
      id: `vm-template-networking-detach-nic-${nic?.NIC_ID}`,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSomething} ${T.NIC} #${nic?.NIC_ID}`,
        dataCy: 'modal-detach-nic',
        description: (
          <ResourceActionConfirmation
            description={T['resource.detach.confirmation']}
            resources={{ ID: nic?.NIC_ID, NAME: nic?.NAME }}
            resourceType={T.NIC}
          />
        ),
        confirmLabel: T.Detach,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => removeAndReorder(nic, nic?.id),
    })
  }

  const openAliasForm = (nic) => {
    showModal({
      id: `vm-template-networking-alias-${nic?.NIC_ID}`,
      dialogProps: {
        title: `${T.Alias} - ${nic?.NAME}`,
        dataCy: 'modal-show-alias',
        dialogWidth: {
          xs: 'calc(100vw - 32px)',
          md: '760px',
          lg: '840px',
        },
        dialogMaxWidth: 'calc(100vw - 32px)',
        dialogMaxHeight: 'calc(100vh - 32px)',
        dialogContentMaxHeight: 'calc(100vh - 184px)',
        dialogContentOverflowY: 'auto',
        confirmLabel: T.Accept,
        cancelButtonProps: {
          sx: { display: 'none' },
        },
      },
      form: VirtualMachine.Forms.AliasForm({
        stepProps: {
          parent: nic?.NAME,
          methods,
        },
        initialValues: {
          ALIAS: alias,
        },
      }),
    })
  }

  const getNicActions = (nic) => {
    if (isAdditionalIp(nic)) return []

    const aliasLength = getAliasLength(nic)
    const disableDetach =
      !adminGroup &&
      hasRestrictedAttributes(nic, 'NIC', oneConfig?.VM_RESTRICTED_ATTR)

    return [
      {
        title: T.Edit,
        tooltip: T.Edit,
        dataCy: `nic-edit-${getNicDataCyId(nic)}`,
        onClick: () => openEditNicForm(nic),
      },
      !aliasLength && {
        title: T.Detach,
        dataCy: `detach-nic-${getNicDataCyId(nic)}`,
        tooltip: disableDetach ? T.DetachRestricted : T.Detach,
        isDisabled: disableDetach,
        onClick: () => openDetachNicConfirm(nic),
      },
      {
        title: T.Alias,
        tooltip: T.Alias,
        dataCy: `alias-nic-${getNicDataCyId(nic)}`,
        onClick: () => openAliasForm(nic),
      },
    ].filter(Boolean)
  }

  return (
    <div>
      <FormWithSchema
        cy={`${EXTRA_ID}-network-options`}
        fields={FIELDS}
        legend={T.NetworkDefaults}
        legendTooltip={T.NetworkDefaultsConcept}
        id={EXTRA_ID}
        rootProps={{
          sx: {
            border: 0,
            m: 0,
            minWidth: 0,
            minInlineSize: 0,
            p: 0,
            width: '100%',
          },
        }}
        saveState={true}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1em',
          mt: '1em',
          width: '100%',
        }}
      >
        <Legend title={T.Networks} />
        <Button
          data-cy="vm-template-networking-attach-nic"
          type="secondary"
          onClick={openAttachNicForm}
        >
          {T.AttachNic}
        </Button>
      </Box>
      <Box sx={{ mt: '1em' }}>
        {cardNics.length ? (
          <Box
            sx={{
              display: 'grid',
              gap: '1em',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            {cardNics.map((nic) => (
              <NetworkingNicCard
                actions={getNicActions(nic)}
                aliasLength={getAliasLength(nic)}
                key={nic?.id ?? `${nic?.NAME}-${nic?.NIC_ID}`}
                nic={nic}
              />
            ))}
          </Box>
        ) : (
          <EmptyContent
            subtitle={T.AttachedNicsWillAppearHere}
            title={T.NoNics}
          />
        )}
      </Box>
    </div>
  )
}

Networking.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'network',
  name: T.Network,
  icon: NetworkIcon,
  Content: Networking,
  getError: (error) => TAB_ID.some((id) => error?.[id]),
}

export default TAB

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
import { useFormContext, useFieldArray } from 'react-hook-form'
import { ServerConnection as NetworkIcon } from 'iconoir-react'
import {
  NETWORK_INPUT_FIELDS,
  NETWORK_SELECTION,
  NETWORK_TYPES,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking/schema'
import {
  ExtraDropdown,
  SECTION_ID as NETWORKS_VALUES_ID,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking/extraDropdown'

import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { Stack } from '@mui/material'
import { T } from '@ConstantsModule'

import {
  AR,
  SG,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking/extraDropdown/sections'
import { useSelectableCardPanel } from '@HooksModule'

import { SCHEMA } from '@modules/resources/resources/ServiceTemplate/Forms/InstantiateForm/Steps/Networks/schema'

export const STEP_ID = 'networks'

const Content = () => {
  const { watch } = useFormContext()

  const wNetworks = watch(`${STEP_ID}.${STEP_ID}`)
  const wNetworksValues = watch(`${STEP_ID}.${NETWORKS_VALUES_ID}`)

  const {
    fields: networks,
    append: appendNet,
    remove: rmNet,
  } = useFieldArray({
    name: `${STEP_ID}.${STEP_ID}`,
  })

  const { append: appendNetv, remove: rmNetv } = useFieldArray({
    name: `${STEP_ID}.${NETWORKS_VALUES_ID}`,
  })

  const handleAppend = () => {
    appendNet({
      name: '',
      description: '',
      network: null,
      size: null,
      value: '',
      type: null,
    })

    appendNetv({
      [AR.id]: [],
      [SG.id]: [],
    })
  }

  const handleRemoveNetwork = (idx) => {
    rmNetv(idx)
    rmNet(idx)
  }

  const {
    selectedIndex: selectedNetwork,
    setSelectedIndex: setSelectedNetwork,
    handleAdd,
    handleRemove,
  } = useSelectableCardPanel({
    items: networks,
    onAdd: handleAppend,
    onRemove: handleRemoveNetwork,
  })

  return (
    <SelectableCardPanel
      items={networks}
      selectedIndex={selectedNetwork}
      onSelect={setSelectedNetwork}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel={T.AddNetwork}
      addButtonCy="extra-add-network"
      getItemKey={(network, idx) => `item-${idx}-${network.id}`}
      cardIcon={NetworkIcon}
      renderCardTitle={(_, idx) =>
        watch(`${STEP_ID}.${STEP_ID}.${idx}.name`) || T.NewNetwork
      }
      renderCardSubtitle={(_, idx) =>
        NETWORK_TYPES?.[watch(`${STEP_ID}.${STEP_ID}.${idx}.type`)] ||
        `${T.No} ${T.Type}`
      }
    >
      {selectedNetwork != null && wNetworks?.length > 0 && (
        <>
          <CollapsiblePanel
            title={T.Type}
            isDefaultCollapsed={false}
            key={`inputs-${networks?.[selectedNetwork]?.id}`}
          >
            <Stack
              direction="column"
              alignItems="flex-start"
              component="form"
              width="100%"
            >
              <FormWithSchema
                id={`${STEP_ID}.${STEP_ID}.${selectedNetwork}`}
                cy={`${STEP_ID}.${STEP_ID}`}
                fields={NETWORK_INPUT_FIELDS(true)}
              />
            </Stack>
          </CollapsiblePanel>

          <ExtraDropdown
            networksValues={wNetworksValues}
            key={`extra-${networks?.[selectedNetwork]?.id}`}
            selectedNetwork={selectedNetwork}
          />

          <CollapsiblePanel
            title={T.Networks}
            isDefaultCollapsed={false}
            key={`network-table-${networks?.[selectedNetwork]?.id}`}
          >
            <FormWithSchema
              cy={`${STEP_ID}-${STEP_ID}-${NETWORK_SELECTION?.name}`}
              id={`${STEP_ID}.${STEP_ID}.${selectedNetwork}`}
              fields={[{ ...NETWORK_SELECTION(true), label: undefined }]}
            />
          </CollapsiblePanel>
        </>
      )}
    </SelectableCardPanel>
  )
}

Content.propTypes = {
  stepId: PropTypes.string,
}

/**
 * Networks step.
 *
 * @returns {object} Networks step
 */
const NetworksStep = () => ({
  id: STEP_ID,
  label: T.Networks,
  optionsValidate: { abortEarly: false },
  resolver: SCHEMA,
  content: () => Content(),
})

export default NetworksStep

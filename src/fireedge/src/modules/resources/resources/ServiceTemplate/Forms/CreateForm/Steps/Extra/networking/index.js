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
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra'

import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'
import { Stack } from '@mui/material'
import { T } from '@ConstantsModule'

import {
  AR,
  SG,
} from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking/extraDropdown/sections'

export const TAB_ID = 'networks'

const Content = () => {
  const { watch } = useFormContext()

  // Updates in real-time compared to the snapshot from the fieldArray hook
  const wNetworks = watch(`${EXTRA_ID}.${TAB_ID}`)
  const wNetworksValues = watch(`${EXTRA_ID}.${NETWORKS_VALUES_ID}`)

  const {
    fields: networks,
    append: appendNet,
    remove: rmNet,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const { append: appendNetv, remove: rmNetv } = useFieldArray({
    name: `${EXTRA_ID}.${NETWORKS_VALUES_ID}`,
  })

  // Very important, define all fields or else RHF uses previous input data
  const handleAppend = () => {
    appendNet({
      name: '',
      description: '',
      size: null,
      value: '',
      type: null,
    })

    appendNetv({
      [AR.id]: [],
      [SG.id]: [],
    })
  }

  const {
    selectedIndex: selectedNetwork,
    setSelectedIndex: setSelectedNetwork,
    handleAdd,
    handleRemove,
  } = useSelectableCardPanel({
    items: networks,
    onAdd: handleAppend,
    onRemove: (idx) => {
      // Remove corresponding entry from networks_values array
      rmNetv(idx)
      rmNet(idx)
    },
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
        watch(`${EXTRA_ID}.${TAB_ID}.${idx}.name`) || T.NewNetwork
      }
      renderCardSubtitle={(_, idx) =>
        NETWORK_TYPES?.[watch(`${EXTRA_ID}.${TAB_ID}.${idx}.type`)] ||
        `${T.No} ${T.Type}`
      }
    >
      {selectedNetwork != null && wNetworks?.length > 0 && (
        <>
          <CollapsiblePanel
            key={`inputs-${networks?.[selectedNetwork]?.id}`}
            title={T.Type}
            isDefaultCollapsed={false}
          >
            <Stack
              direction="column"
              alignItems="flex-start"
              gap="0.5rem"
              component="form"
              width="100%"
            >
              <FormWithSchema
                id={`${EXTRA_ID}.${TAB_ID}.${selectedNetwork}`}
                cy={`${TAB_ID}`}
                fields={NETWORK_INPUT_FIELDS(false)}
              />
            </Stack>
          </CollapsiblePanel>

          <ExtraDropdown
            networksValues={wNetworksValues}
            key={`extra-${networks?.[selectedNetwork]?.id}`}
            selectedNetwork={selectedNetwork}
          />

          <CollapsiblePanel
            key={`network-table-${networks?.[selectedNetwork]?.id}`}
            title={T.Networks}
            isDefaultCollapsed={false}
          >
            <FormWithSchema
              cy={`${TAB_ID}-${NETWORK_SELECTION?.name}`}
              id={`${EXTRA_ID}.${TAB_ID}.${selectedNetwork}`}
              fields={[{ ...NETWORK_SELECTION(false), label: undefined }]}
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

const TAB = {
  id: TAB_ID,
  name: T.Networks,
  icon: NetworkIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB

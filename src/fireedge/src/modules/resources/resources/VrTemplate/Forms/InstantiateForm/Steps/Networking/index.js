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
import { v4 as uuidv4 } from 'uuid'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/VrTemplate/Forms/InstantiateForm/Steps/Networking/schema'
import { T } from '@ConstantsModule'
import { ServerConnection as NetworkIcon } from 'iconoir-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  CollapsiblePanel,
  FormWithSchema,
  SelectableCardPanel,
} from '@ComponentsV2Module'
import { useSelectableCardPanel } from '@HooksModule'
import { Stack } from '@mui/material'
import { SecurityGroupAPI, VnAPI } from '@FeaturesModule'

export const STEP_ID = 'networking'

const getDefaultNic = () => ({
  RDP: false,
  SSH: false,
  NETWORK_ID: null,
  IP: undefined,
  FLOATING_IP: false,
  IP6: undefined,
  VROUTER_MANAGEMENT: false,
  SECURITY_GROUPS: null,
  nicId: uuidv4(),
})

const Content = () => {
  const { watch } = useFormContext()
  const { data: vnets = [] } = VnAPI.useGetVNetworksQuery()
  const { data: secgroups = [] } = SecurityGroupAPI.useGetSecGroupsQuery()

  const {
    fields: nics = [],
    append,
    remove,
  } = useFieldArray({
    name: `${STEP_ID}`,
  })

  const wNics = watch(STEP_ID)

  const {
    selectedIndex: selectedNic,
    setSelectedIndex: setSelectedNic,
    handleAdd,
    handleRemove,
  } = useSelectableCardPanel({
    items: nics,
    onAdd: () => append(getDefaultNic()),
    onRemove: remove,
  })

  const getNetworkName = (networkId) => {
    const network = vnets.find(({ ID }) => String(ID) === String(networkId))

    return network?.NAME
  }

  const getSecurityGroupName = (securityGroupId) => {
    const securityGroup = secgroups.find(
      ({ ID }) => String(ID) === String(securityGroupId)
    )

    return securityGroup?.NAME
  }

  return (
    <SelectableCardPanel
      items={nics}
      selectedIndex={selectedNic}
      onSelect={setSelectedNic}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel={T.VirtualRouterNICAdd}
      addButtonCy="add-nic"
      getItemKey={(nic, idx) => `nic-${idx}-${nic?.id}`}
      cardIcon={NetworkIcon}
      renderCardTitle={(_, idx) =>
        getNetworkName(watch(`${STEP_ID}.${idx}.NETWORK_ID`)) ||
        T.VirtualRouterNICNetworkName
      }
      renderCardSubtitle={(_, idx) => {
        const nic = wNics?.[idx] ?? {}
        const values = [
          nic?.IP,
          nic?.IP6,
          getSecurityGroupName(nic?.SECURITY_GROUPS),
        ].filter(Boolean)

        return values.length > 0 ? values.join(' - ') : T.SecurityGroups
      }}
    >
      {selectedNic != null && selectedNic >= 0 && nics?.length > 0 && (
        <CollapsiblePanel
          title={T.VirtualRouterNICNetworkConfiguration}
          isDefaultCollapsed={false}
          key={`nic-${nics?.[selectedNic]?.id}`}
        >
          <Stack
            direction="column"
            alignItems="flex-start"
            component="form"
            width="100%"
          >
            <FormWithSchema
              legend={T.VirtualRouterNICNetworkConfiguration}
              cy={STEP_ID}
              fields={FIELDS}
              saveState
              id={`${STEP_ID}.${selectedNic}`}
            />
          </Stack>
        </CollapsiblePanel>
      )}
    </SelectableCardPanel>
  )
}

/**
 * Basic configuration about VM Template.
 *
 * @returns {object} Basic configuration step
 */
const Networking = () => ({
  id: STEP_ID,
  label: T.ConfigureNetworking,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(),
})

export default Networking

/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { Box, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import {
  AddAddressRangeAction,
  DeleteAddressRangeAction,
  UpdateAddressRangeAction,
} from 'client/components/Buttons'
import AddressRangeCard from 'client/components/Cards/AddressRangeCard'
import {
  useGetVNTemplateQuery,
  useUpdateVNTemplateMutation,
} from 'client/features/OneApi/networkTemplate'
import { jsonToXml } from 'client/models/Helper'

import { AddressRange, VN_ACTIONS } from 'client/constants'

const { ADD_AR, UPDATE_AR, DELETE_AR } = VN_ACTIONS

const handleAdd = async ({ value, id, update, template }) => {
  const addressRanges = [template?.AR ?? []].flat()
  addressRanges.push(value)
  const templateJson = { ...template, AR: addressRanges }

  const newTemplate = jsonToXml(templateJson)
  await update({ id, template: newTemplate }).unwrap()
}

const handleUpdate = async ({ value, id, addressID, update, template }) => {
  let templateJson = { ...template, AR: value }

  if (Array.isArray(template?.AR)) {
    const addressRanges = [template.AR ?? []].flat()
    addressRanges[addressID] = value
    templateJson = { ...template, AR: addressRanges }
  }

  const newTemplate = jsonToXml(templateJson)
  await update({ id, template: newTemplate }).unwrap()
}

const handleDelete = async ({ id, addressID, update, template }) => {
  const { AR, ...rest } = template
  let templateJson = { ...rest }

  if (Array.isArray(template?.AR)) {
    const addressRanges = [template.AR ?? []].flat()
    addressRanges.splice(addressID, 1)
    templateJson = { ...template, AR: addressRanges }
  }

  const newTemplate = jsonToXml(templateJson)
  await update({ id, template: newTemplate }).unwrap()
}

/**
 * Renders the list of address ranges from a Virtual Network.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Network id
 * @param {object} props.oneConfig - Open Nebula configuration
 * @param {boolean} props.adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} AR tab
 */
const AddressTab = ({
  tabProps: { actions } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const { data: vnet } = useGetVNTemplateQuery(
    { id },
    { refetchOnMountOrArgChange: true }
  )
  const [update] = useUpdateVNTemplateMutation()

  /** @type {AddressRange[]} */
  const addressRanges = [vnet?.TEMPLATE?.AR ?? []].flat()
  const template = vnet?.TEMPLATE

  return (
    <Box padding={{ sm: '0.8em' }}>
      {actions[ADD_AR] === true && (
        <AddAddressRangeAction
          vnetId={id}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
          onSubmit={(value) =>
            handleAdd({
              value,
              id,
              update,
              template,
            })
          }
        />
      )}

      <Stack gap="1em" py="0.8em">
        {addressRanges.map((ar, addressID) => (
          <AddressRangeCard
            key={addressID}
            vnet={vnet}
            ar={ar}
            actions={
              <>
                {actions[UPDATE_AR] === true && (
                  <UpdateAddressRangeAction
                    vnetId={id}
                    ar={ar}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                    template={vnet}
                    onSubmit={(value) =>
                      handleUpdate({
                        value,
                        id,
                        addressID,
                        update,
                        template,
                      })
                    }
                  />
                )}
                {actions[DELETE_AR] === true && (
                  <DeleteAddressRangeAction
                    vnetId={id}
                    ar={ar}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                    template={vnet}
                    onSubmit={() =>
                      handleDelete({
                        id,
                        addressID,
                        update,
                        template,
                      })
                    }
                  />
                )}
              </>
            }
          />
        ))}
      </Stack>
    </Box>
  )
}

AddressTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

AddressTab.displayName = 'AddressTab'

export default AddressTab

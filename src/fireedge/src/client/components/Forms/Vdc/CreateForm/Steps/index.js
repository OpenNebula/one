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
import { jsonToXml } from 'client/models/Helper'
import { createSteps, getUnknownAttributes } from 'client/utils'
import CustomAttributes, { STEP_ID as CUSTOM_ID } from './CustomVariables'
import General, { STEP_ID as GENERAL_ID } from './General'
import Groups, { STEP_ID as GROUPS_ID } from './GroupsTable'
import Resources, { STEP_ID as RESOURCES_ID } from './Resources'

const parseResources = ({ resources, key, newKey }) => {
  const regex = new RegExp(`^${key}_Z\\d+$`)

  return Object.keys(resources)
    .filter((internalKey) => regex.test(internalKey))
    .map((internalKey) => ({
      zone_id: internalKey.match(/\d+$/)[0],
      [newKey]: resources[internalKey],
    }))
}

const parseInitialResources = (resource = [], filterBy, key) => {
  const data = Array.isArray(resource) ? resource : [resource]

  return data.reduce((acc, obj) => {
    const zoneId = obj[filterBy]
    const name = `${key}_Z${zoneId}`

    if (!acc[name]) {
      acc[name] = []
    }

    acc[name].push(obj[`${key}_ID`])

    return acc
  }, {})
}

const Steps = createSteps([General, Groups, Resources, CustomAttributes], {
  transformInitialValue: (vdcTemplate, schema) => {
    const groups = vdcTemplate?.GROUPS?.ID
    const groupsData = groups ? (Array.isArray(groups) ? groups : [groups]) : []

    const datastores = parseInitialResources(
      vdcTemplate?.DATASTORES?.DATASTORE,
      'ZONE_ID',
      'DATASTORE'
    )

    const knownTemplate = schema.cast(
      {
        [GENERAL_ID]: { ...vdcTemplate, ...vdcTemplate.TEMPLATE },
        [GROUPS_ID]: groupsData,
        [RESOURCES_ID]: {
          ...parseInitialResources(
            vdcTemplate?.CLUSTERS?.CLUSTER,
            'ZONE_ID',
            'CLUSTER'
          ),
          ...datastores,
          ...parseInitialResources(vdcTemplate?.HOSTS?.HOST, 'ZONE_ID', 'HOST'),
          ...parseInitialResources(vdcTemplate?.VNETS?.VNET, 'ZONE_ID', 'VNET'),
        },
      },
      {
        stripUnknown: true,
      }
    )

    const knownAttributes = {
      ...knownTemplate[GENERAL_ID],
    }

    // Set the unknown attributes to the custom variables section
    knownTemplate[CUSTOM_ID] = getUnknownAttributes(
      vdcTemplate?.TEMPLATE,
      knownAttributes
    )

    return knownTemplate
  },
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: general = {},
      [CUSTOM_ID]: customAttributes = {},
      [GROUPS_ID]: groups = [],
      [RESOURCES_ID]: resources = {},
    } = formData ?? {}

    const rtn = {
      template: jsonToXml({
        ...general,
        ...customAttributes,
      }),
    }

    if (resources?.ZONE_ID) {
      rtn.groups = groups

      rtn.clusters = parseResources({
        resources,
        key: 'CLUSTER',
        newKey: 'cluster_id',
      })

      rtn.datastores = parseResources({
        resources,
        key: 'DATASTORE',
        newKey: 'ds_id',
      })

      rtn.hosts = parseResources({
        resources,
        key: 'HOST',
        newKey: 'host_id',
      })

      rtn.vnets = parseResources({
        resources,
        key: 'VNET',
        newKey: 'vnet_id',
      })
    }

    return rtn
  },
})

export default Steps

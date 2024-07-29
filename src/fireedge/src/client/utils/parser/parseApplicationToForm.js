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
import { v4 as uuidv4 } from 'uuid'

import { STEP_ID as APPLICATION_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/BasicConfiguration'
import { STEP_ID as CLUSTER_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Clusters'
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Networking'
import { STEP_ID as TIERS_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers'

import { templateToObject } from 'client/utils'

const parseNetwork = (input) => {
  const [name, values] = input
  const network = String(values).split('|')
  // 0 mandatory; 1 network (user input type); 2 description; 3 empty; 4 info_network;
  const mandatory = network[0] === 'M'
  const description = network[2]

  // 0 type; 1 id; 3 extra (optional)
  const info = network[4].split(':')
  const type = info[0]
  const idVnet = info[1]
  const extra = info[2] ?? ''

  return {
    id: uuidv4(),
    name,
    mandatory,
    description,
    type,
    idVnet,
    extra,
  }
}

const parseCluster = (tiers) => {
  const NUM_REG = /(\d+)/g

  const clusters = tiers?.map(({ vm_template_contents: content = '' }) => {
    const { sched_requirements: schedRequirements } = templateToObject(content)

    return schedRequirements?.match(NUM_REG)?.join()
  })

  return clusters?.find((i) => i !== undefined)
}

const parseTiers = (roles, networking) =>
  roles
    ?.reduce((res, data) => {
      const {
        name,
        cardinality,
        parents,
        min_vms: minVms,
        max_vms: maxVms,
        cooldown,
        shutdown_action: shutdownAction,
        vm_template: vmTemplate,
        vm_template_contents: content = '',
        elasticity_policies: elasticityPolicies = [],
        scheduled_policies: scheduledPolicies = [],
        position = { x: 0, y: 0 },
      } = data

      const hash = templateToObject(content)
      const nics = hash.nic

      const networks =
        nics?.map(({ network_id: networkId }) => {
          const nicName = networkId?.replace('$', '')
          const network = networking?.find((vnet) => vnet.name === nicName)

          return network.id
        }) ?? []

      const elasticity = elasticityPolicies.map(({ id, ...policy }) =>
        JSON.parse(JSON.stringify(policy))
      )

      const scheduled = scheduledPolicies.map(
        ({ id, recurrence, start_time: time, ...rest }) => ({
          ...JSON.parse(JSON.stringify(rest)),
          ...(recurrence && {
            time_format: 'recurrence',
            time_expression: recurrence,
          }),
          ...(time && {
            time_format: 'start_time',
            time_expression: time,
          }),
        })
      )

      return [
        ...res,
        {
          id: uuidv4(),
          template: { id: String(vmTemplate) },
          networks,
          parents,
          policies: {
            min_vms: minVms,
            max_vms: maxVms,
            cooldown,
            elasticity,
            scheduled,
          },
          position,
          tier: { name, cardinality, shutdown_action: shutdownAction },
        },
      ]
    }, [])
    .reduce((res, tier, _, src) => {
      const parents = tier.parents?.map((name) => {
        const parent = src.find((item) => item.tier.name === name)

        return parent?.id
      })

      return [...res, { ...tier, parents }]
    }, [])

/**
 * Parses service application data to form structure.
 *
 * @param {object} data - OpenNebula service
 * @returns {object} Form data
 */
const mapApplicationToForm = (data) => {
  const {
    NAME,
    TEMPLATE: {
      BODY: { networks = [], roles, ...application },
    },
  } = data

  const networking = Object.entries(networks)?.map(parseNetwork) ?? []
  const tiers = parseTiers(roles, networking) ?? []
  const cluster = [...(parseCluster(roles) ?? '')]

  return {
    [APPLICATION_ID]: {
      ...application,
      name: NAME,
    },
    [NETWORKING_ID]: networking,
    [CLUSTER_ID]: cluster,
    [TIERS_ID]: tiers,
  }
}

export default mapApplicationToForm

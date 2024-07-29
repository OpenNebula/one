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
import { STEP_ID as APPLICATION_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/BasicConfiguration'
import { STEP_ID as CLUSTER_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Clusters'
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Networking'
import { STEP_ID as TIERS_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers'

const mapNetworkToUserInput = (network) => {
  const { mandatory, description, type, idVnet, extra } = network

  const mandatoryValue = mandatory ? 'M' : 'O'
  const descriptionValue = description ?? ''
  const idVnetValue = idVnet ?? ''
  const extraValue = `:${extra ?? ''}`

  return `${mandatoryValue}|network|${descriptionValue}| |${type}:${idVnetValue}${extraValue}`
}

/**
 * Map tiers defined in the form and transforms
 * to OpenNebula service template role.
 *
 * @param {Array} tiers - Tiers defined in the form
 * @param {Array} networking - List of networks
 * @param {string|number} cluster - Cluster id
 * @returns {Array} Roles
 */
export const mapTiersToRoles = (tiers, networking, cluster) =>
  tiers?.map((data) => {
    const { template, networks, parents, policies, position, tier } = data
    const { shutdown_action: action, ...information } = tier
    const { elasticity, scheduled, ...adjustments } = policies

    const networksValue = networks
      ?.reduce((res, id, idx) => {
        const network = networking.find((net) => net.id === id)
        const networkString = `NIC = [\n NAME = "NIC${idx}",\n NETWORK_ID = "$${network.name}" ]\n`

        return [...res, networkString]
      }, [])
      ?.join('')
      ?.concat(`SCHED_REQUIREMENTS = "ClUSTER_ID=\\"${cluster}\\""`)

    const parentsValue = parents?.reduce((res, id) => {
      const parent = tiers.find((t) => t.id === id)

      return [...res, parent?.tier?.name]
    }, [])

    const elasticityValues = elasticity.map(({ id, ...policy }) =>
      JSON.parse(JSON.stringify(policy))
    )

    const scheduledValues = scheduled.map(
      ({ id, time_format: format, time_expression: expression, ...rest }) => ({
        ...JSON.parse(JSON.stringify(rest)),
        ...(expression && { [format]: expression }),
      })
    )

    return {
      ...information,
      ...adjustments,
      ...(action !== 'none' && { shutdown_action: action }),
      parents: parentsValue,
      vm_template: template?.id ?? template?.app,
      vm_template_contents: networksValue,
      elasticity_policies: elasticityValues,
      scheduled_policies: scheduledValues,
      position,
    }
  })

/**
 * Formats form data to create or update an OpenNebula service template.
 *
 * @param {object} formData - Form data
 * @returns {object} Formatted data ready to create or update the template.
 */
const mapFormToApplication = (formData) => {
  const {
    [APPLICATION_ID]: application,
    [NETWORKING_ID]: networking,
    [CLUSTER_ID]: cluster,
    [TIERS_ID]: tiers,
  } = formData

  const { shutdown_action: action, ...information } = application

  return {
    ...information,
    ...(action !== 'none' && { shutdown_action: action }),
    networks:
      networking?.reduce(
        (res, { name, ...network }) => ({
          ...res,
          [name]: mapNetworkToUserInput(network),
        }),
        {}
      ) ?? {},
    roles: mapTiersToRoles(tiers, networking, cluster),
  }
}

export default mapFormToApplication

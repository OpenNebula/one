import { STEP_ID as BASIC_ID } from 'client/containers/ApplicationsTemplates/Form/Deploy/Steps/BasicConfiguration'
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Form/Deploy/Steps/Networking'
import { STEP_ID as TIERS_ID } from 'client/containers/ApplicationsTemplates/Form/Deploy/Steps/Tiers'
import { STEP_ID as CLUSTER_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Clusters'

import { deepmerge } from 'client/utils/merge'

export const parseUserInputValue = value => {
  if (value === true) {
    return 'YES'
  } if (value === false) {
    return 'NO'
  } else if (Array.isArray(value)) {
    return value.join(',')
  } else return value
}

export const mapUserInputs = userInputs =>
  Object.entries(userInputs)?.reduce((res, [key, value]) => ({
    ...res, [key]: parseUserInputValue(value)
  }), {})

export const mapTiersToRoles = (tiers, networking, cluster) =>
  tiers?.map(data => {
    const { template, parents, networks, user_inputs_values = {}, tier } = data

    const networksValue = networks
      ?.reduce((res, id, idx) => {
        const network = networking.find(net => net.id === id)
        const networkString = `NIC = [\n NAME = "NIC${idx}",\n NETWORK_ID = "$${network.name}" ]\n`

        return [...res, networkString]
      }, [])
      ?.join('')
      ?.concat(`SCHED_REQUIREMENTS = "ClUSTER_ID=\\"${cluster}\\""`)

    const parentsValue = parents?.reduce((res, id) => {
      const parent = tiers.find(t => t.id === id)
      return [...res, parent?.tier?.name]
    }, [])

    return {
      ...tier,
      parents: parentsValue,
      vm_template: template?.id ?? template?.app,
      vm_template_contents: networksValue,
      user_inputs_values: mapUserInputs(user_inputs_values)
    }
  })

const mapFormToDeployApplication = (formData, template) => {
  const {
    [BASIC_ID]: application,
    [NETWORKING_ID]: networking,
    [CLUSTER_ID]: cluster,
    [TIERS_ID]: tiers
  } = deepmerge(template, formData)

  return {
    ...application,
    custom_attrs_values: {},
    networks_values: networking?.map(({ name, type, idVnet }) => ({
      [name]: { [type]: idVnet }
    })),
    roles: mapTiersToRoles(tiers, networking, cluster)
  }
}

export default mapFormToDeployApplication

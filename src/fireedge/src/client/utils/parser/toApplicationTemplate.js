import { STEP_ID as APPLICATION_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/BasicConfiguration'
import { STEP_ID as CLUSTER_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Clusters'
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Networking'
import { STEP_ID as TIERS_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers'

const mapNetworkToUserInput = network => {
  const { mandatory, description, type, idVnet, extra } = network

  const mandatoryValue = mandatory ? 'M' : 'O'
  const descriptionValue = description ?? ''
  const idVnetValue = idVnet ?? ''
  const extraValue = `:${extra ?? ''}`

  return `${mandatoryValue}|network|${descriptionValue}| |${type}:${idVnetValue}${extraValue}`
}

export const mapTiersToRoles = (tiers, networking, cluster) =>
  tiers?.map(data => {
    const { template, networks, parents, policies, position, tier } = data
    const { shutdown_action: action, ...information } = tier
    const { elasticity, scheduled, ...adjustments } = policies

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

    const elasticityValues = elasticity.map(({ id, ...policy }) =>
      JSON.parse(JSON.stringify(policy))
    )

    const scheduledValues = scheduled.map(
      ({ id, time_format: format, time_expression: expression, ...rest }) => ({
        ...JSON.parse(JSON.stringify(rest)),
        ...(expression && { [format]: expression })
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
      position
    }
  })

const mapFormToApplication = data => {
  const {
    [APPLICATION_ID]: application,
    [NETWORKING_ID]: networking,
    [CLUSTER_ID]: cluster,
    [TIERS_ID]: tiers
  } = data

  const { shutdown_action: action, ...information } = application

  return {
    ...information,
    ...(action !== 'none' && { shutdown_action: action }),
    networks:
      networking?.reduce(
        (res, { name, ...network }) => ({
          ...res,
          [name]: mapNetworkToUserInput(network)
        }),
        {}
      ) ?? {},
    roles: mapTiersToRoles(tiers, networking, cluster)
  }
}

export default mapFormToApplication

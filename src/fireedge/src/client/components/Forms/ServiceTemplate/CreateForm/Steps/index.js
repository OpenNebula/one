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
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/General'
import Extra, {
  STEP_ID as EXTRA_ID,
} from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'
import RoleDefinition, {
  STEP_ID as ROLE_DEFINITION_ID,
} from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'

import RoleConfig, {
  STEP_ID as ROLE_CONFIG_ID,
} from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig'

import {
  parseNetworkString,
  parseCustomInputString,
  parseVmTemplateContents,
  convertKeysToCase,
  createSteps,
} from 'client/utils'

const Steps = createSteps([General, Extra, RoleDefinition, RoleConfig], {
  transformInitialValue: (ServiceTemplate, schema) => {
    const definedNetworks = Object.entries(
      ServiceTemplate?.TEMPLATE?.BODY?.networks || {}
    )
      ?.map(([name, networkString]) =>
        parseNetworkString(`${name}|${networkString}`, true)
      )
      .filter(Boolean)

    const customAttributes = Object.entries(
      ServiceTemplate?.TEMPLATE?.BODY?.custom_attrs || {}
    )
      ?.map(([name, customInputString]) =>
        parseCustomInputString(`${name}|${customInputString}`, true)
      )
      .filter(Boolean)

    const reversedVmTc = ServiceTemplate?.TEMPLATE?.BODY?.roles?.map((role) =>
      parseVmTemplateContents(role?.vm_template_contents, true)
    )

    const generalData = {
      NAME: ServiceTemplate?.TEMPLATE?.BODY?.name,
      DESCRIPTION: ServiceTemplate?.TEMPLATE?.BODY.description,
    }

    const definedRoles = ServiceTemplate?.TEMPLATE?.BODY?.roles
      ?.filter((role) => role != null)
      ?.map((role) => ({
        NAME: role?.name,
        CARDINALITY: role?.cardinality,
        SELECTED_VM_TEMPLATE_ID: [role?.vm_template.toString()],
        ...(role?.parents ? { PARENTS: role?.parents } : {}),
      }))

    const roleDefinitionData = definedRoles?.map((role) => ({
      ...role,
    }))

    const networkDefs = reversedVmTc?.map((rtc) => rtc.networks)

    const roleConfigData = {
      ELASTICITYPOLICIES: convertKeysToCase(
        ServiceTemplate?.TEMPLATE?.BODY?.roles
          ?.filter((role) => role != null)
          ?.reduce((acc, role, index) => {
            if (role?.elasticity_policies) {
              acc[index] = role.elasticity_policies.reduce(
                (policyAcc, policy) => {
                  policyAcc.push({
                    ...policy,
                    COOLDOWN: +policy.cooldown,
                    ...(policy?.min && { MIN: +policy.min }),
                    PERIOD: +policy.period,
                    PERIOD_NUMBER: +policy.period_number,
                  })

                  return policyAcc
                },
                []
              )
            }

            return acc
          }, []),
        false
      ),
      SCHEDULEDPOLICIES: convertKeysToCase(
        ServiceTemplate?.TEMPLATE?.BODY?.roles
          ?.filter((role) => role != null)
          ?.reduce((acc, role, index) => {
            if (role?.scheduled_policies) {
              acc[index] = role.scheduled_policies.reduce(
                (policyAcc, policy) => {
                  policyAcc.push({
                    ...(+policy?.min && { MIN: policy?.min }),
                    SCHEDTYPE: policy?.type,
                    TIMEFORMAT: policy?.recurrence
                      ? 'Recurrence'
                      : 'Start time',
                    TIMEEXPRESSION: policy?.recurrence || policy?.start_time,
                  })

                  return policyAcc
                },
                []
              )
            }

            return acc
          }, []),
        false
      ),
      vm_template_contents: reversedVmTc?.map(
        (content) => content?.remainingContent
      ),
      MINMAXVMS: ServiceTemplate?.TEMPLATE?.BODY?.roles
        ?.filter((role) => role != null)
        ?.map((role) => ({
          min_vms: role.min_vms,
          max_vms: role.max_vms,
          cooldown: role.cooldown,
        }))
        ?.filter((role) =>
          Object.values(role).some((val) => val !== undefined)
        ),

      NETWORKDEFS: networkDefs,
      RDP: networkDefs?.reduce((acc, nics, idx) => {
        const rdpRow =
          nics?.filter((nic) => nic?.RDP)?.[0]?.NETWORK_ID?.slice(1) ?? ''
        acc[idx] = rdpRow

        return acc
      }, {}),
    }

    const knownTemplate = schema.cast(
      {
        [EXTRA_ID]: {
          NETWORKING: definedNetworks,
          CUSTOM_ATTRIBUTES: customAttributes,
          // Sched actions are same for all roles, so just grab the first one
          SCHED_ACTION: reversedVmTc?.[0]?.schedActions,
        },
        [GENERAL_ID]: { ...generalData },
        [ROLE_DEFINITION_ID]: roleDefinitionData,
        [ROLE_CONFIG_ID]: { ...roleConfigData },
      },
      { stripUnknown: false }
    )

    return knownTemplate
  },

  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: generalData,
      [ROLE_DEFINITION_ID]: roleDefinitionData,
      [EXTRA_ID]: extraData,
      [ROLE_CONFIG_ID]: roleConfigData,
    } = formData

    const getVmTemplateContents = (index) => {
      const contents = parseVmTemplateContents({
        networks:
          roleConfigData?.NETWORKS?.[index] ||
          roleConfigData?.NETWORKDEFS?.[index],
        rdpConfig: roleConfigData?.RDP?.[index],
        remainingContent: roleConfigData?.vm_template_contents?.[index],
        schedActions: extraData?.SCHED_ACTION,
      })

      return contents || ''
    }

    const getScheduledPolicies = (index) => {
      const policies = roleConfigData?.SCHEDULEDPOLICIES?.[index]?.map(
        (policy) => {
          const { SCHEDTYPE, ADJUST, TIMEFORMAT, TIMEEXPRESSION, ...rest } =
            policy

          return {
            ...rest,
            TYPE: SCHEDTYPE,
            ADJUST: Number(ADJUST),
            [TIMEFORMAT?.split(' ')?.join('_')?.toLowerCase()]: TIMEEXPRESSION,
          }
        }
      )

      return policies?.length ? policies : undefined
    }

    const getElasticityPolicies = (index) => {
      const elasticityPolicies = roleConfigData?.ELASTICITYPOLICIES?.[index]
      if (!elasticityPolicies || elasticityPolicies.length === 0)
        return undefined

      return elasticityPolicies.map(({ ADJUST, ...rest }) => ({
        ...rest,
        ...(ADJUST && { adjust: Number(ADJUST) }),
      }))
    }

    const getNetworks = () => {
      if (!extraData?.NETWORKING?.length) return undefined

      return extraData.NETWORKING.reduce((acc, network) => {
        if (network?.name) {
          acc[network.name] = parseNetworkString(network)
        }

        return acc
      }, {})
    }

    const getCustomAttributes = () => {
      if (!extraData?.CUSTOM_ATTRIBUTES?.length) return undefined

      return extraData.CUSTOM_ATTRIBUTES.reduce((acc, cinput) => {
        if (cinput?.name) {
          acc[cinput.name] = parseCustomInputString(cinput)
        }

        return acc
      }, {})
    }

    const getRoleParents = (index) => {
      if (
        !roleDefinitionData?.[index]?.PARENTS ||
        !Array.isArray(roleDefinitionData?.[index]?.PARENTS) ||
        roleDefinitionData?.[index]?.PARENTS?.length <= 0
      )
        return undefined

      return roleDefinitionData?.[index]?.PARENTS
    }

    try {
      const formatTemplate = {
        ...generalData,
        ...extraData?.ADVANCED,
        roles: roleDefinitionData?.map((roleDef, index) => {
          const newRoleDef = {
            ...roleDef,
            ...roleConfigData?.MINMAXVMS?.[index],
            VM_TEMPLATE: Number(roleDef?.SELECTED_VM_TEMPLATE_ID?.[0]),
            vm_template_contents: getVmTemplateContents(index),
            parents: getRoleParents(index),
            scheduled_policies: getScheduledPolicies(index),
            elasticity_policies: getElasticityPolicies(index),
          }

          delete newRoleDef.SELECTED_VM_TEMPLATE_ID
          delete newRoleDef.MINMAXVMS

          return newRoleDef
        }),
        networks: getNetworks(),
        custom_attrs: getCustomAttributes(),
      }

      const cleanedTemplate = {
        ...convertKeysToCase(formatTemplate, true, 1),
        ...(formatTemplate?.roles || formatTemplate?.ROLES
          ? {
              roles: convertKeysToCase(
                formatTemplate?.roles || formatTemplate?.ROLES
              ),
            }
          : {}),
      }

      return cleanedTemplate
    } catch (error) {}
  },
})

export default Steps

/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
      }))

    const roleDefinitionData = definedRoles?.map((role) => ({
      ...role,
    }))

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

      NETWORKDEFS: reversedVmTc?.map((rtc) => rtc.networks),
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
      { stripUnknown: true }
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

    const formatTemplate = {
      ...generalData,
      roles: roleDefinitionData?.map((roleDef, index) => {
        const scheduledPolicies = roleConfigData?.SCHEDULEDPOLICIES?.[
          index
        ]?.map((policy) => {
          const newPolicy = {
            ...policy,
            TYPE: policy?.SCHEDTYPE,
            ADJUST: +policy?.ADJUST,
            [policy.TIMEFORMAT?.split(' ')?.join('_')?.toLowerCase()]:
              policy.TIMEEXPRESSION,
          }
          delete newPolicy.SCHEDTYPE
          delete newPolicy.TIMEFORMAT
          delete newPolicy.TIMEEXPRESSION

          return newPolicy
        })

        const newRoleDef = {
          vm_template_contents: parseVmTemplateContents({
            networks: roleConfigData?.NETWORKS?.[index] ?? undefined,
            schedActions: extraData?.SCHED_ACTION ?? undefined,
          }),
          ...roleDef,

          ...roleConfigData?.MINMAXVMS?.[index],
          VM_TEMPLATE: +roleDef?.SELECTED_VM_TEMPLATE_ID?.[0],
          ...(scheduledPolicies &&
            scheduledPolicies.length > 0 && {
              scheduled_policies: scheduledPolicies,
            }),
          elasticity_policies: [
            ...roleConfigData?.ELASTICITYPOLICIES?.[index].flatMap((elap) => ({
              ...elap,
              ...(elap?.ADJUST && { adjust: +elap?.ADJUST }),
            })),
          ],
        }

        delete newRoleDef.SELECTED_VM_TEMPLATE_ID
        delete newRoleDef.MINMAXVMS

        return newRoleDef
      }),
      ...extraData?.ADVANCED,
      ...(extraData?.NETWORKING?.length && {
        networks: extraData?.NETWORKING?.reduce((acc, network) => {
          if (network?.name) {
            acc[network.name] = parseNetworkString(network)
          }

          return acc
        }, {}),
      }),
      custom_attrs: extraData?.CUSTOM_ATTRIBUTES?.reduce((acc, cinput) => {
        if (cinput?.name) {
          acc[cinput.name] = parseCustomInputString(cinput)
        }

        return acc
      }, {}),
    }

    return convertKeysToCase(formatTemplate)
  },
})

export default Steps

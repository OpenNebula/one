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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import { Card, LabelSlot, MetadataSlot, TitleSlot } from '@ComponentsV2Module'
import { getRoleState, getServiceRoleNodes } from '@ModelsModule'

/**
 * Service Role Card component displays a Service role as a card.
 *
 * @param {object} root0 - Params
 * @param {object} root0.role - Service role data
 * @param {boolean} root0.isSelected - Whether card is selected
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {boolean} root0.isRemoveCheckbox - Whether to hide the checkbox
 * @param {object} ref - Forwarded ref
 * @returns {Component} Service role card component
 */
export const ServiceRoleCard = forwardRef(
  (
    { role = {}, isSelected, onCheck, onClick, isRemoveCheckbox = false },
    ref
  ) => {
    const {
      name,
      cardinality,
      elasticity_policies: elasticityPolicies,
      max_vms: maxVms,
      min_vms: minVms,
      parents,
      scheduled_policies: scheduledPolicies,
      template_id: templateId,
      vm_template: vmTemplate,
    } = role

    const roleState = getRoleState(role?.state) ?? {}
    const nodes = getServiceRoleNodes(role)
    const vmTemplateId = templateId ?? vmTemplate
    const parentRoles = [].concat(parents ?? []).filter(Boolean)
    const elasticityPolicyCount = []
      .concat(elasticityPolicies ?? [])
      .filter(Boolean).length
    const scheduledPolicyCount = []
      .concat(scheduledPolicies ?? [])
      .filter(Boolean).length

    return (
      <Card
        ref={ref}
        onCheck={onCheck}
        onClick={onClick}
        isSelected={isSelected}
        isRemoveCheckbox={isRemoveCheckbox}
        slots={[
          [
            TitleSlot,
            {
              title: name,
              status: roleState?.color,
              statusName: roleState?.displayName,
            },
          ],
          [
            MetadataSlot,
            {
              labels: [
                [T.Cardinality, String(cardinality ?? 0)],
                [T.VMTemplate, vmTemplateId && `#${vmTemplateId}`],
                [T.Nodes, String(nodes.length)],
                [T.RolesMinVms, minVms && String(minVms)],
                [T.RolesMaxVms, maxVms && String(maxVms)],
              ].filter(([, value]) => value),
            },
          ],
          (parentRoles.length ||
            elasticityPolicyCount ||
            scheduledPolicyCount) && [
            LabelSlot,
            {
              labels: [
                parentRoles.length && [
                  `${T.ParentRoles}: ${parentRoles.join(', ')}`,
                  'information',
                ],
                elasticityPolicyCount && [
                  `${T.ElasticityPolicies}: ${elasticityPolicyCount}`,
                  'miscellaneous',
                ],
                scheduledPolicyCount && [
                  `${T.ScheduledPolicies}: ${scheduledPolicyCount}`,
                  'miscellaneous2',
                ],
              ].filter(Boolean),
            },
          ],
        ]}
      />
    )
  }
)

ServiceRoleCard.propTypes = {
  role: PropTypes.object,
  isSelected: PropTypes.bool,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
  isRemoveCheckbox: PropTypes.bool,
}

ServiceRoleCard.displayName = 'ServiceRoleCard'

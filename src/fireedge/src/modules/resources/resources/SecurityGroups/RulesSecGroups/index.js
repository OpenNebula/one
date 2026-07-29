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

import { Component, forwardRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { ResourceLink, Table } from '@ComponentsV2Module'
import { RULESECURITYGROUP_COLUMNS } from '@ModelsModule'
import { T, RESOURCE_NAMES } from '@ConstantsModule'
/**
 * RulesSecGroups component.
 *
 * @param {object} root0 - Params
 * @returns {Component} - RulesSecGroups component
 */
export const RulesSecGroups = forwardRef(({ title, rules = [] }, ref) => {
  const formattedRules = useMemo(
    () =>
      rules.map((rule = {}) => {
        const {
          PROTOCOL = '',
          RULE_TYPE = '',
          ICMP_TYPE = '',
          // eslint-disable-next-line camelcase
          ICMPv6_TYPE = '',
          RANGE = T.All,
          NETWORK_ID = T.Any,
          IP,
          SIZE,
        } = rule

        let NETWORK = ''

        if (IP && SIZE) {
          NETWORK = `${T.Start}: ${IP}, ${T.Size}: ${SIZE}`
        } else if (NETWORK_ID && NETWORK_ID !== T.Any && !isNaN(NETWORK_ID)) {
          NETWORK = (
            <ResourceLink resource={RESOURCE_NAMES.VNET} data={NETWORK_ID}>
              {NETWORK_ID}
            </ResourceLink>
          )
        } else {
          NETWORK = NETWORK_ID
        }

        return {
          PROTOCOL,
          RULE_TYPE,
          RANGE,
          NETWORK,
          ICMP_TYPE,
          ICMPv6_TYPE,
        }
      }),
    [rules]
  )

  return (
    <Table
      ref={ref}
      title={title ?? T.SecurityGroup}
      data={formattedRules}
      columns={RULESECURITYGROUP_COLUMNS}
    />
  )
})

RulesSecGroups.propTypes = {
  title: PropTypes.string,
  rules: PropTypes.array,
}

RulesSecGroups.displayName = 'RuleSecGroups'

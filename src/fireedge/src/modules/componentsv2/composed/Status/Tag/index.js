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
import { Tag } from '@modules/componentsv2/primitives/Tags'
import { Badge } from '@modules/componentsv2/primitives/Badge'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {string} root0.title - Status label fallback
 * @param {string} root0.statusColor - Status color
 * @param {string} root0.statusName - Status label
 * @returns {Component} - Status Tag component
 */
export const StatusTag = forwardRef(
  (
    { title, statusColor = 'default', statusName, isBadged = true, ...opts },
    ref
  ) => {
    const { translate } = useTranslation()
    const status = statusName || title

    return (
      <Tag
        ref={ref}
        title={translate(T[status] ?? status)}
        status={statusColor}
        startIcon={isBadged && <Badge status={statusColor} type="dot" />}
        {...opts}
      />
    )
  }
)

StatusTag.propTypes = {
  title: PropTypes.string,
  statusColor: PropTypes.string,
  statusName: PropTypes.string,
  isBadged: PropTypes.bool,
}

StatusTag.displayName = 'StatusTag'

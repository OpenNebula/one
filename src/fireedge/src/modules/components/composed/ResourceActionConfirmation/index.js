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

import { memo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'

import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * @typedef {object} AffectedResource
 * @property {string|number} [ID] - Resource ID
 * @property {string|number} [id] - Resource ID
 * @property {string} [NAME] - Resource name
 * @property {string} [name] - Resource name
 * @property {AffectedResource} [original] - Datatable row resource
 */

const normalizeResource = (resource = {}) => {
  const source = resource?.original ?? resource
  const id = source?.ID ?? source?.id
  const name = source?.NAME ?? source?.name

  return { id, name }
}

const formatResource = ({ id, name }) => {
  if (name && (id || id === 0)) return `${name} (#${id})`
  if (name) return name
  if (id || id === 0) return `#${id}`

  return '-'
}

/**
 * Renders a confirmation message and the affected resource list.
 *
 * @param {object} root0 - Props
 * @param {string|object} root0.description - Confirmation message
 * @param {AffectedResource|AffectedResource[]} root0.resources - Resources
 * @param {string} root0.resourceType - Name of the resource
 * @returns {object} Confirmation description
 */
export const ResourceActionConfirmation = memo(
  ({ description, resources = [], resourceType = 'resources' }) => {
    const { translate, translateText } = useTranslation()
    const normalizedResources = []
      .concat(resources)
      .filter(Boolean)
      .map(normalizeResource)
      .filter(({ id, name }) => name || id || id === 0)

    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        {description && (
          <Typography component="p" variant="body1">
            {typeof description === 'string'
              ? translateText(description)
              : description}
          </Typography>
        )}

        {!!normalizedResources.length && (
          <Box>
            <Typography component="p" variant="body1" fontWeight={600}>
              {translate(resourceType ?? T.Resources)}
            </Typography>

            <Box component="ul" sx={{ m: 0, mt: 1, pl: 3 }}>
              {normalizedResources.map((resource, idx) => (
                <Typography
                  component="li"
                  key={`${resource.id ?? resource.name ?? idx}`}
                  variant="body1"
                >
                  {formatResource(resource)}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    )
  }
)

ResourceActionConfirmation.propTypes = {
  description: PropTypes.node,
  resources: PropTypes.oneOfType([
    PropTypes.shape({
      ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      NAME: PropTypes.string,
      name: PropTypes.string,
      original: PropTypes.object,
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        NAME: PropTypes.string,
        name: PropTypes.string,
        original: PropTypes.object,
      })
    ),
  ]),
  resourceType: PropTypes.string,
}

ResourceActionConfirmation.displayName = 'ResourceActionConfirmation'

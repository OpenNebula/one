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

import PropTypes from 'prop-types'
import { Box, Link } from '@mui/material'
import { DetailsCard, TagList } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { getApplicationDescription, getApplicationName } from '@ModelsModule'
import { About } from '@modules/resources/OneKs/Details/Application/Tabs/About'

/**
 * @param {object} props - Tab props
 * @param {object} props.application - Installed application
 * @returns {object} Release information tab
 */
export const Info = ({ application = {} }) => {
  const { about, documentationUrl } = application?.metadata ?? {}
  const description = getApplicationDescription(application)
  const dependencies = (
    Array.isArray(application?.dependencies) ? application.dependencies : []
  )
    .map((dependency) =>
      typeof dependency === 'string'
        ? dependency
        : dependency?.release_name ?? getApplicationName(dependency)
    )
    .filter(Boolean)
  const documentation = /^https?:\/\//i.test(documentationUrl ?? '') ? (
    <Link href={documentationUrl} target="_blank" rel="noopener noreferrer">
      {documentationUrl}
    </Link>
  ) : undefined
  const hasInformation = Boolean(
    description || dependencies.length || documentation
  )

  return (
    <Box sx={{ display: 'grid', alignContent: 'start', gap: 2, minWidth: 0 }}>
      <About sections={about} releaseName={application?.release_name} />
      {hasInformation && (
        <DetailsCard
          title={T.Information}
          options={[
            description && [T.Description, description],
            dependencies.length && [
              T.Dependencies,
              <TagList
                key="dependencies"
                tags={dependencies.map((title) => ({ title }))}
                max={dependencies.length}
                wrap
              />,
            ],
            documentation && [T.Documentation, documentation],
          ]}
        />
      )}
    </Box>
  )
}

Info.displayName = 'Info'
Info.id = 'info'
Info.title = T.Info
Info.propTypes = { application: PropTypes.object }

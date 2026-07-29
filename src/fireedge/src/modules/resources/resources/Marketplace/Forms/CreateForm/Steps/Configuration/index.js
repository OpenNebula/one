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
import { Box, Link, Stack } from '@mui/material'
import { FormWithSchema } from '@ComponentsV2Module'
import { T, MARKET_TYPES } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'
import { useFormContext } from 'react-hook-form'
import { generateDocLink } from '@UtilsModule'

export const STEP_ID = 'configuration'

const CENTERED_GRID_CONTAINER_SX = {
  gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
}

const FORM_LAYOUTS = {
  [MARKET_TYPES.OPENNEBULA.value]: {
    columns: [[], ['ENDPOINT'], []],
    gridContainerSx: CENTERED_GRID_CONTAINER_SX,
  },
  [MARKET_TYPES.HTTP.value]: {
    columns: [[], ['BASE_URL', 'PUBLIC_DIR', 'BRIDGE_LIST'], []],
    gridContainerSx: CENTERED_GRID_CONTAINER_SX,
  },
  [MARKET_TYPES.S3.value]: {
    columns: [
      ['ENDPOINT', 'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY', 'BUCKET'],
      ['REGION', 'TOTAL_MB', 'READ_LENGTH', 'AWS', 'SIGNATURE_VERSION'],
    ],
  },
  [MARKET_TYPES.LINUX_CONTAINERS.value]: {
    columns: [
      ['BASE_URL', 'IMAGE_SIZE_MB', 'FILESYSTEM', 'FORMAT'],
      ['CPU', 'VCPU', 'MEMORY', 'SKIP_UNTESTED', 'PRIVILEGED'],
    ],
  },
}

const DocumentationLink = ({ href, children }) => (
  <Link target="_blank" href={href} rel="noreferrer" underline="hover">
    {children}
  </Link>
)

DocumentationLink.propTypes = {
  href: PropTypes.string,
  children: PropTypes.node,
}

const DOCUMENTATION_BY_MARKET_TYPE = {
  [MARKET_TYPES.OPENNEBULA.value]: {
    title: 'marketplace.types.one',
    paragraphs: [
      {
        text: 'marketplace.form.configuration.one.help.paragraph.1',
        link: {
          href: 'http://marketplace.opennebula.io/appliance',
          text: 'marketplace.form.configuration.one.help.paragraph.1.link',
        },
      },
      'marketplace.form.configuration.one.help.paragraph.2',
    ],
    path: 'marketplace/public_marketplaces/opennebula.html',
    linkText: 'marketplace.form.configuration.one.help.link',
  },
  [MARKET_TYPES.HTTP.value]: {
    title: 'marketplace.types.http',
    paragraphs: [
      'marketplace.form.configuration.http.help.paragraph.1',
      'marketplace.form.configuration.http.help.paragraph.2',
    ],
    path: 'marketplace/private_marketplaces/market_http.html',
    linkText: 'marketplace.form.configuration.http.help.link',
  },
  [MARKET_TYPES.S3.value]: {
    title: 'marketplace.types.s3',
    paragraphs: [
      'marketplace.form.configuration.s3.help.paragraph.1',
      'marketplace.form.configuration.s3.help.paragraph.2',
    ],
    path: 'marketplace/private_marketplaces/market_s3.html',
    linkText: 'marketplace.form.configuration.s3.help.link',
  },
  [MARKET_TYPES.LINUX_CONTAINERS.value]: {
    title: 'marketplace.types.linuxcontainers',
    paragraphs: [
      {
        text: 'marketplace.form.configuration.linuxcontainers.help.paragraph.1.1',
        link: {
          href: T[
            'marketplace.form.configuration.linuxcontainers.help.paragraph.1.link'
          ],
          text: 'marketplace.form.configuration.linuxcontainers.help.paragraph.1.2',
        },
        suffix:
          'marketplace.form.configuration.linuxcontainers.help.paragraph.1.3',
      },
      'marketplace.form.configuration.linuxcontainers.help.paragraph.2',
    ],
    path: 'marketplace/public_marketplaces/lxc.html',
    linkText: 'marketplace.form.configuration.linuxcontainers.help.link',
  },
}

const ConfigurationDocumentation = ({ version }) => {
  const { watch } = useFormContext()
  const documentation =
    DOCUMENTATION_BY_MARKET_TYPE[watch('general.MARKET_MAD')]

  if (!documentation) return null

  const { title, paragraphs, path, linkText } = documentation

  return (
    <Stack gap="1em">
      <Box component="strong">{T[title]}</Box>
      {paragraphs.map((paragraph) => {
        const { text, link, suffix } =
          typeof paragraph === 'string' ? { text: paragraph } : paragraph

        return (
          <Box key={text}>
            {T[text]}
            {link && (
              <DocumentationLink href={link.href}>
                {T[link.text]}
              </DocumentationLink>
            )}
            {suffix && T[suffix]}
          </Box>
        )
      })}
      <Box>
        <DocumentationLink href={generateDocLink(version, path)}>
          {T[linkText]}
        </DocumentationLink>
      </Box>
    </Stack>
  )
}

ConfigurationDocumentation.propTypes = {
  version: PropTypes.string,
}

/**
 * Return content of the step.
 *
 * @param {boolean} update - If the user is updating or creating the form
 * @returns {object} - Content of the step
 */
const Content = (update) => {
  const { watch } = useFormContext()
  const marketType = watch('general.MARKET_MAD')
  const { columns, gridContainerSx } = FORM_LAYOUTS[marketType] ?? {}

  return (
    <Stack direction="column" spacing="1em" sx={{ paddingTop: '24px' }}>
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}`}
        fields={FIELDS(update)}
        columns={columns}
        gridContainerSx={gridContainerSx}
      />
    </Stack>
  )
}

/**
 * Configuration attributes.
 *
 * @param {object} props - Step props
 * @param {string} props.version - OpenNebula version
 * @param {boolean} props.update - If the user is updating or creating the form
 * @returns {object} AdvancedOptions configuration step
 */
const Configuration = ({ version, update }) => ({
  id: STEP_ID,
  label: T['marketplace.configuration.title'],
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(update),
  documentation: {
    title: T['marketplace.configuration.title'],
    content: () => <ConfigurationDocumentation version={version} />,
    link: 'marketplace/index.html',
    version,
  },
})

Configuration.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
  version: PropTypes.string,
  update: PropTypes.bool,
}

export default Configuration

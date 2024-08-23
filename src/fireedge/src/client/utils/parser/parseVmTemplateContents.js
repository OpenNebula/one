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
import _ from 'lodash'

/* eslint-disable no-useless-escape */
const formatNic = (nic, parent, rdp) => {
  const [[NIC, NETWORK_ID]] = Object.entries(nic)

  return `${
    parent ? 'NIC_ALIAS' : 'NIC'
  } = [\n  NAME = \"${NIC}\",\n  NETWORK_ID = \"$${
    NETWORK_ID !== undefined ? NETWORK_ID : ''
  }\"${rdp ? `,\n RDP = \"YES\"` : ''}${
    parent ? `,\n PARENT = \"${parent}\"` : ''
  } ]\n`
}

const formatAlias = (fNics) =>
  fNics?.map((fnic) => {
    if (fnic?.alias || fnic?.PARENT) {
      const parent =
        fnic?.PARENT ??
        fNics?.find((nic) => nic?.NIC_NAME === fnic?.alias?.name)?.NIC_ID
      fnic.formatNic = formatNic({ [fnic?.NIC_ID]: fnic?.NIC_NAME }, parent)
    }

    return ''
  })

const formatSchedActions = (schedAction) => {
  const { ACTION, TIME, DAYS, END_TYPE, END_VALUE, REPEAT, ID } = schedAction
  const formattedProperties = [
    END_TYPE != null ? `  END_TYPE = \"${END_TYPE}\"` : '',
    END_VALUE != null ? `  END_VALUE = \"${END_VALUE}\"` : '',
    TIME != null ? `  TIME = \"${TIME}\"` : '',
    ACTION != null ? `  ACTION = \"${ACTION}\"` : '',
    ID != null ? `  ID = \"${ID}\"` : '',
    DAYS != null ? `  DAYS = \"${DAYS}\"` : '',
    REPEAT != null ? `  REPEAT = \"${REPEAT}\"` : '',
  ]
    .filter((line) => line)
    .join(`,\n`)

  return ` SCHED_ACTION = [\n${formattedProperties} ]\n`
}
/* eslint-enable no-useless-escape */

const parseProperties = (section) => {
  const properties = {}
  const regex = /(\w+)\s*=\s*"([^"]*)"/g
  let match
  while ((match = regex.exec(section))) {
    properties[match[1]] = match[2]
  }

  return properties
}

const parseSection = (section) => {
  const headerMatch = section.match(/^(NIC|NIC_ALIAS|SCHED_ACTION)/)
  if (!headerMatch) return null

  const header = headerMatch[0]
  const content = parseProperties(section)

  return { header, content }
}

const extractSections = (content) => {
  const sections = []
  const regex = /(NIC|NIC_ALIAS|SCHED_ACTION)\s*=\s*\[[^\]]+\]/g
  let match
  while ((match = regex.exec(content))) {
    sections.push(match[0])
  }

  return sections
}

const extractPropertiesToArray = (content) => {
  const properties = []
  const regex = /(\w+\s*=\s*"[^"]*")/g
  let match
  while ((match = regex.exec(content))) {
    properties.push(match[1])
  }

  return properties
}

const formatInstantiate = (contents) => {
  const { vmTemplateContents, customAttrsValues, schedActions } = contents

  const sections = extractSections(vmTemplateContents)
    .map(parseSection)
    .filter(Boolean)

  const nonNicContent = vmTemplateContents.replace(
    /(NIC|NIC_ALIAS|SCHED_ACTION)\s*=\s*\[[^\]]+\]/g,
    ''
  )

  const templateProperties = extractPropertiesToArray(nonNicContent)

  const customProperties = Object.entries(customAttrsValues).map(
    ([key, value]) => `${key.toUpperCase()} = "${value}"`
  )

  const combinedProperties = _.uniqWith(
    [...templateProperties, ...customProperties],
    _.isEqual
  )

  const filteredProperties = combinedProperties.filter(
    (property) => !property.includes('= ""')
  )

  const combinedContent = [
    ...sections.map(({ header, content }) => {
      const props = Object.entries(content)
        .map(([key, value]) => `  ${key.toUpperCase()} = "${value}"`)
        .join(',\n')

      return `${header} = [\n${props} ]`
    }),
    ...filteredProperties,
  ]

  const formattedActions = schedActions?.map((action, index) =>
    formatSchedActions({ ...action, ID: index })
  )

  const formattedTemplate =
    combinedContent.join('\n') + formattedActions.join('\n') + '\n'

  return formattedTemplate
}

/**
 * @param {object} contents - Vm template contents
 * @param {boolean} reverse - Reverse Vm template string?
 * @param {boolean} instantiate - Instantiate dialog
 * @returns {string} - Formatted Vm template content
 */
const formatVmTemplateContents = (
  contents,
  reverse = false,
  instantiate = false
) => {
  if (!contents) {
    return ''
  }

  if (instantiate) {
    return formatInstantiate(contents)
  }

  if (reverse) {
    const nics = []
    const schedActions = []
    const sections = contents.match(
      /(NIC_ALIAS|NIC|SCHED_ACTION)\s*=\s*\[[^\]]+\]/g
    )
    const remainingContent = contents
      .replace(/(NIC_ALIAS|NIC|SCHED_ACTION)\s*=\s*\[[^\]]+\]/g, '')
      .trim()

    if (!sections) return { networks: nics, schedActions, remainingContent }

    sections.forEach((section) => {
      const parsedSection = parseSection(section)
      if (!parsedSection) return

      const { header, content } = parsedSection
      if (header === 'NIC' || header === 'NIC_ALIAS') {
        nics.push(content)
      } else if (header === 'SCHED_ACTION') {
        schedActions.push(content)
      }
    })

    return { networks: nics, schedActions, remainingContent }
  } else {
    const { networks, rdpConfig, schedActions, remainingContent } = contents
    const preformattedNetworks = networks.every(
      (network) =>
        network?.NAME &&
        network?.NETWORK_ID &&
        network?.NAME?.replace(/_/g, '')?.startsWith('NIC') &&
        network?.NETWORK_ID?.includes('$')
    )

    const formattedActions = schedActions?.map((action, index) =>
      formatSchedActions({ ...action, ID: index })
    )

    const formattedNics = networks
      ?.filter((net) => net?.rowSelected || preformattedNetworks)
      ?.map((nic, index) => ({
        formatNic: formatNic(
          {
            [`_${
              preformattedNetworks
                ? nic?.NAME?.replace(/_/g, '')
                : `NIC${index}`
            }`]: preformattedNetworks
              ? nic?.NETWORK_ID?.replace(/\$/g, '')
              : nic?.name,
          },
          false,
          preformattedNetworks ? nic?.RDP === 'YES' : nic?.name === rdpConfig
        ),
        NIC_ID: `_NIC${index}`,
        NIC_NAME: preformattedNetworks
          ? nic?.NETWORK_ID?.replace(/\$/g, '')
          : nic?.name,
        ...(nic?.aliasIdx !== -1 && { alias: networks?.[nic?.aliasIdx] }),
        ...(preformattedNetworks && nic?.PARENT ? { PARENT: nic?.PARENT } : {}),
      }))

    formatAlias(formattedNics)

    let vmTemplateContents =
      formattedNics?.map((nic) => nic.formatNic).join('') ?? ''

    vmTemplateContents += formattedActions?.join('') ?? ''
    vmTemplateContents += remainingContent ? `\n${remainingContent}` : ''

    return vmTemplateContents
  }
}

export default formatVmTemplateContents

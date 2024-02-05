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

/* eslint-disable no-useless-escape */
const formatNic = (nic, parent) => {
  const [[NIC, NETWORK_ID]] = Object.entries(nic)

  return `${
    parent ? 'NIC_ALIAS' : 'NIC'
  } = [\n  NAME = \"${NIC}\",\n  NETWORK_ID = \"$${
    NETWORK_ID !== undefined ? NETWORK_ID.toLowerCase() : ''
  }\"${parent ? `,\n PARENT = \"${parent}\"` : ''} ]\n`
}

const formatAlias = (fNics) => {
  fNics?.map((fnic) => {
    if (fnic?.alias) {
      const parent = fNics?.find(
        (nic) => nic?.NIC_NAME === fnic?.alias?.name
      )?.NIC_ID
      fnic.formatNic = formatNic({ [fnic?.NIC_ID]: fnic?.NIC_NAME }, parent)
    }

    return ''
  })
}

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

const formatInstantiate = (contents) => {
  const { vmTemplateContents, customAttrsValues } = contents

  const formatUserInputs = Object.entries(customAttrsValues)
    ?.map(([input, value]) => `${input.toLowerCase()} = "${value}"`)
    ?.join('\n')
    ?.concat('\n')

  return vmTemplateContents + formatUserInputs
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

    if (!sections) return { networks: nics, schedActions }

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

    return { networks: nics, schedActions }
  } else {
    const { networks, schedActions } = contents
    if (!networks) {
      return ''
    }

    const formattedActions = schedActions?.map((action, index) =>
      formatSchedActions({ ...action, ID: index })
    )
    const formattedNics = networks
      ?.filter((net) => net?.rowSelected)
      ?.map((nic, index) => ({
        formatNic: formatNic({
          [`_NIC${index}`]: nic?.name,
        }),
        NIC_ID: `_NIC${index}`,
        NIC_NAME: nic?.name,
        ...(nic?.aliasIdx !== -1 && { alias: networks?.[nic?.aliasIdx] }),
      }))

    formatAlias(formattedNics)

    const vmTemplateContents = formattedNics
      ?.map((nic) => nic.formatNic)
      .join('')
      .concat(formattedActions?.join('') ?? '')

    return vmTemplateContents
  }
}

export default formatVmTemplateContents

/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import {
  Breadcrumbs,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  Select,
} from '@mui/material'
import { NavArrowRight } from 'iconoir-react'
import { marked } from 'marked'
import PropTypes from 'prop-types'
import { memo, useEffect, useMemo, useState } from 'react'

import { ProvisionTemplateCard } from '@modules/components/Cards'
import { ListCards } from '@modules/components/List'
import { T } from '@ConstantsModule'
import { ProviderAPI, ProvisionAPI } from '@FeaturesModule'
import { useListForm } from '@HooksModule'
import { isValidProviderTemplate } from '@ModelsModule'
import { Step, deepmerge, sanitize } from '@UtilsModule'

import { STEP_FORM_SCHEMA } from '@modules/components/Forms/Provider/CreateForm/Steps/Template/schema'

import { STEP_ID as CONFIGURATION_ID } from '@modules/components/Forms/Provider/CreateForm/Steps/BasicConfiguration'
import { STEP_ID as CONNECTION_ID } from '@modules/components/Forms/Provider/CreateForm/Steps/Connection'

export const STEP_ID = 'template'

// ----------------------------------------------------------
// Markdown Description
// ----------------------------------------------------------

marked.use({
  renderer: {
    link(href, title, text) {
      return `
        <a class='description__link'
          target='_blank' rel='nofollow' title='${title ?? ''}' href='${href}'>
          ${text}
        </a>
      `
    },
  },
})

const Description = memo(
  ({ description = '' }) => {
    const html = marked.parse(sanitize`${description}`)

    return <div dangerouslySetInnerHTML={{ __html: html }} />
  },
  (prev, next) => prev.description === next.description
)

Description.displayName = 'ProviderTypeDescription'
Description.propTypes = { description: PropTypes.string }

// ----------------------------------------------------------
// Step content : Select Provider Template
// ----------------------------------------------------------

const Content = ({ data, setFormData }) => {
  const { data: provisionTemplates = {}, isSuccess: successRequestProvision } =
    ProvisionAPI.useGetProvisionTemplatesQuery()
  const { data: providerConfig = {}, isSuccess: successRequestProvider } =
    ProviderAPI.useGetProviderConfigQuery()
  const templateSelected = data?.[0]

  const provisionTypes = useMemo(
    () => [
      ...new Set(
        Object.values(providerConfig)
          .map((provider) => provider?.provision_type)
          .flat()
      ),
    ],
    [providerConfig]
  )

  const [providerSelected, setProvider] = useState(
    () => templateSelected?.provider
  )
  const [provisionSelected, setProvision] = useState(
    () => templateSelected?.plain?.provision_type ?? provisionTypes[0]
  )

  const [templatesByProvisionSelected, providerTypes, providerDescription] =
    useMemo(() => {
      const templates = Object.values(
        provisionTemplates?.[provisionSelected]?.providers || {}
      ).flat()
      const types = [...new Set(templates.map(({ provider }) => provider))]
      const provisionDescription =
        provisionTemplates?.[provisionSelected]?.description

      return [templates, types, provisionDescription]
    }, [provisionSelected, provisionTemplates])

  const templatesAvailable = useMemo(
    () =>
      templatesByProvisionSelected.filter(
        ({ provider }) => providerSelected === provider
      ),
    [providerSelected]
  )

  useEffect(() => {
    // set first provision type
    !provisionSelected && setProvision(provisionTypes[0])
  }, [])

  useEffect(() => {
    // set first provider type
    provisionSelected && !providerSelected && setProvider(providerTypes[0])
  }, [provisionSelected])

  const { handleSelect, handleUnselect, handleClear } = useListForm({
    key: STEP_ID,
    list: data,
    setList: setFormData,
    getItemId: (item) => item.name,
  })

  const handleChangeProvision = (evt) => {
    setProvision(evt.target.value)
    setProvider(undefined)
    templateSelected && handleClear()
  }

  const handleChangeProvider = (evt) => {
    setProvider(evt.target.value)
    templateSelected && handleClear()
  }

  const handleClick = (template, isSelected) => {
    const { name, description } = template
    const extraPlainInfo = { plain: { provision_type: provisionSelected } }

    // reset rest of form when change template
    setFormData({
      [CONFIGURATION_ID]: { name, description },
      [CONNECTION_ID]: {},
    })

    isSelected
      ? handleUnselect(name)
      : handleSelect(deepmerge(template, extraPlainInfo))
  }

  if (!successRequestProvider || !successRequestProvision) {
    return <LinearProgress sx={{ width: '100%' }} />
  }

  return (
    <>
      {/* -- SELECTORS -- */}
      <Breadcrumbs separator={<NavArrowRight />}>
        <FormControl>
          <InputLabel shrink id="select-provision-type-label">
            {'Provision type'}
          </InputLabel>
          <Select
            inputProps={{ 'data-cy': 'select-provision-type' }}
            labelId="select-provision-type-label"
            native
            sx={{ marginTop: '1em', minWidth: '8em' }}
            onChange={handleChangeProvision}
            value={provisionSelected}
            variant="outlined"
          >
            <option key="" value="">
              --
            </option>
            {provisionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel shrink id="select-provider-type-label">
            {'Provider type'}
          </InputLabel>
          <Select
            inputProps={{ 'data-cy': 'select-provider-type' }}
            labelId="select-provider-type-label"
            native
            sx={{ marginTop: '1em', minWidth: '8em' }}
            onChange={handleChangeProvider}
            value={providerSelected}
            variant="outlined"
          >
            <option key="" value="">
              --
            </option>
            {providerTypes.map((type) => (
              <option key={type} value={type}>
                {providerConfig[type]?.name ?? type}
              </option>
            ))}
          </Select>
        </FormControl>
      </Breadcrumbs>

      {/* -- DESCRIPTION -- */}
      {providerDescription && <Description description={providerDescription} />}

      <Divider sx={{ margin: '1rem 0' }} />

      {/* -- LIST -- */}
      <ListCards
        keyProp="name"
        list={templatesAvailable}
        gridProps={{ 'data-cy': 'providers-templates' }}
        CardComponent={ProvisionTemplateCard}
        cardsProps={({ value = {} }) => {
          const isSelected = data?.some(
            (selected) => selected.name === value.name
          )
          const isValid = isValidProviderTemplate(value, providerConfig)
          const image = providerConfig?.[value.provider]?.image

          return {
            image,
            isProvider: true,
            isSelected,
            isValid,
            handleClick: () => handleClick(value, isSelected),
          }
        }}
      />
    </>
  )
}

/**
 * Step to select the Provider Template.
 *
 * @returns {Step} Provider Template step
 */
const Template = () => ({
  id: STEP_ID,
  label: T.ProviderTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export * from '@modules/components/Forms/Provider/CreateForm/Steps/Template/schema'
export default Template

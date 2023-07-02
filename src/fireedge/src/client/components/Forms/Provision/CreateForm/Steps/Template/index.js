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
import { memo, useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Divider,
  Select,
  Breadcrumbs,
  InputLabel,
  FormControl,
} from '@mui/material'
import { NavArrowRight } from 'iconoir-react'
import { marked } from 'marked'

import { useListForm } from 'client/hooks'
import {
  useGetProvidersQuery,
  useGetProviderConfigQuery,
} from 'client/features/OneApi/provider'
import { useGetProvisionTemplatesQuery } from 'client/features/OneApi/provision'
import { ListCards } from 'client/components/List'
import { ProvisionTemplateCard } from 'client/components/Cards'
import { Step, sanitize } from 'client/utils'
import { isValidProvisionTemplate } from 'client/models/ProvisionTemplate'
import { T } from 'client/constants'

import { STEP_ID as PROVIDER_ID } from 'client/components/Forms/Provision/CreateForm/Steps/Provider'
import { STEP_ID as CONFIGURATION_ID } from 'client/components/Forms/Provision/CreateForm/Steps/BasicConfiguration'
import { STEP_ID as INPUTS_ID } from 'client/components/Forms/Provision/CreateForm/Steps/Inputs'
import { STEP_FORM_SCHEMA } from 'client/components/Forms/Provision/CreateForm/Steps/Template/schema'

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
// Step content : Select Provision Template
// ----------------------------------------------------------

const Content = ({ data, setFormData }) => {
  const { data: provisionTemplates } = useGetProvisionTemplatesQuery()
  const { data: providers } = useGetProvidersQuery()
  const { data: providerConfig } = useGetProviderConfigQuery()
  const templateSelected = data?.[0]

  const provisionTypes = useMemo(
    () => [
      ...new Set(
        Object.values(providerConfig)
          .map((provider) => provider?.provision_type)
          .flat()
      ),
    ],
    []
  )

  const [providerSelected, setProvider] = useState(
    () => templateSelected?.provider
  )
  const [provisionSelected, setProvision] = useState(
    () => templateSelected?.provision_type ?? provisionTypes[0]
  )

  const [templatesByProvisionSelected, providerTypes, providerDescription] =
    useMemo(() => {
      const templates = Object.values(
        provisionTemplates[provisionSelected]?.provisions
      ).flat()
      const types = [...new Set(templates.map(({ provider }) => provider))]
      const provisionDescription =
        provisionTemplates?.[provisionSelected]?.description

      return [templates, types, provisionDescription]
    }, [provisionSelected])

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
    setList: setFormData,
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
    const { name, description, defaults, hosts } = template

    // reset rest of form when change template
    const providerName =
      defaults?.provision?.provider_name ?? hosts?.[0]?.provision.provider_name
    const providerFromProvisionTemplate =
      providers?.filter(({ NAME }) => NAME === providerName) ?? []

    setFormData({
      [PROVIDER_ID]: providerFromProvisionTemplate,
      [CONFIGURATION_ID]: { name, description },
      [INPUTS_ID]: undefined,
    })

    isSelected
      ? handleUnselect(name, (item) => item.name === name)
      : handleSelect({ ...template, provision_type: provisionSelected })
  }

  return (
    <>
      {/* -- SELECTORS -- */}
      <Breadcrumbs separator={<NavArrowRight />}>
        <FormControl>
          <InputLabel color="secondary" shrink id="select-provision-type-label">
            {'Provision type'}
          </InputLabel>
          <Select
            color="secondary"
            inputProps={{ 'data-cy': 'select-provision-type' }}
            labelId="select-provision-type-label"
            native
            sx={{ marginTop: '1em', minWidth: '8em' }}
            onChange={handleChangeProvision}
            value={provisionSelected}
            variant="outlined"
          >
            {provisionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel color="secondary" shrink id="select-provider-type-label">
            {'Provider type'}
          </InputLabel>
          <Select
            color="secondary"
            inputProps={{ 'data-cy': 'select-provider-type' }}
            labelId="select-provider-type-label"
            native
            sx={{ marginTop: '1em', minWidth: '8em' }}
            onChange={handleChangeProvider}
            value={providerSelected}
            variant="outlined"
          >
            {providerTypes.map((type) => (
              <option key={type} value={type}>
                {providerConfig[type]?.name ?? type}
              </option>
            ))}
          </Select>
        </FormControl>
      </Breadcrumbs>

      {/* -- DESCRIPTION -- */}
      {useMemo(
        () =>
          providerDescription && (
            <Description description={providerDescription} />
          ),
        [providerDescription]
      )}

      <Divider sx={{ margin: '1rem 0' }} />

      {/* -- LIST -- */}
      <ListCards
        keyProp="name"
        list={templatesAvailable}
        gridProps={{ 'data-cy': 'provisions-templates' }}
        CardComponent={ProvisionTemplateCard}
        cardsProps={({ value = {} }) => {
          const isSelected = data?.some(
            (selected) => selected.name === value.name
          )
          const isValid = isValidProvisionTemplate(value)

          return {
            image: value?.image,
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
 * Step to select the Provision Template.
 *
 * @returns {Step} Provision Template step
 */
const Template = () => ({
  id: STEP_ID,
  label: T.ProvisionTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default Template

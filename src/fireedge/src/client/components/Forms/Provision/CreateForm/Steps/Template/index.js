/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Divider,
  Select,
  Breadcrumbs,
  InputLabel,
  FormControl,
} from '@mui/material'
import { NavArrowRight } from 'iconoir-react'
import Marked from 'marked'

import { useListForm } from 'client/hooks'
import { useAuth } from 'client/features/Auth'
import { useProvider, useProvisionTemplate } from 'client/features/One'
import { ListCards } from 'client/components/List'
import { ProvisionTemplateCard } from 'client/components/Cards'
import { sanitize } from 'client/utils'
import { isValidProvisionTemplate } from 'client/models/ProvisionTemplate'
import { T } from 'client/constants'

import { STEP_ID as PROVIDER_ID } from 'client/components/Forms/Provision/CreateForm/Steps/Provider'
import { STEP_ID as CONFIGURATION_ID } from 'client/components/Forms/Provision/CreateForm/Steps/BasicConfiguration'
import { STEP_ID as INPUTS_ID } from 'client/components/Forms/Provision/CreateForm/Steps/Inputs'
import { STEP_FORM_SCHEMA } from 'client/components/Forms/Provision/CreateForm/Steps/Template/schema'

const renderer = new Marked.Renderer()

renderer.link = (href, title, text) => `
  <a class='description__link'
    target='_blank' rel='nofollow' title='${title ?? ''}' href='${href}'>
    ${text}
  </a>
`

export const STEP_ID = 'template'

const Template = () => ({
  id: STEP_ID,
  label: T.ProvisionTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const providers = useProvider()
    const provisionTemplates = useProvisionTemplate()
    const { providerConfig } = useAuth()
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
        defaults?.provision?.provider_name ??
        hosts?.[0]?.provision.provider_name
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

    const RenderDescription = ({ description = '' }) => {
      const html = Marked(sanitize`${description}`, { renderer })

      return <div dangerouslySetInnerHTML={{ __html: html }} />
    }

    return (
      <>
        {/* -- SELECTORS -- */}
        <Breadcrumbs separator={<NavArrowRight />}>
          <FormControl>
            <InputLabel
              color="secondary"
              shrink
              id="select-provision-type-label"
            >
              {'Provision type'}
            </InputLabel>
            <Select
              color="secondary"
              inputProps={{ 'data-cy': 'select-provision-type' }}
              labelId="select-provision-type-label"
              native
              style={{ marginTop: '1em', minWidth: '8em' }}
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
            <InputLabel
              color="secondary"
              shrink
              id="select-provider-type-label"
            >
              {'Provider type'}
            </InputLabel>
            <Select
              color="secondary"
              inputProps={{ 'data-cy': 'select-provider-type' }}
              labelId="select-provider-type-label"
              native
              style={{ marginTop: '1em', minWidth: '8em' }}
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
              <RenderDescription description={providerDescription} />
            ),
          [providerDescription]
        )}

        <Divider style={{ margin: '1rem 0' }} />

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
  }, []),
})

export default Template

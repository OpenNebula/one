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
import React, { useCallback, useEffect, useMemo } from 'react'
import { Divider, Select, Breadcrumbs, InputLabel, FormControl } from '@material-ui/core'
import { NavArrowRight } from 'iconoir-react'
import Marked from 'marked'

import { useListForm } from 'client/hooks'
import { useOne } from 'client/features/One'
import { ListCards } from 'client/components/List'
import { ProvisionTemplateCard } from 'client/components/Cards'
import { sanitize, groupBy } from 'client/utils'
import * as ProvisionTemplateModel from 'client/models/ProvisionTemplate'
import { T, PROVISIONS_TYPES, PROVIDERS_TYPES } from 'client/constants'

import { STEP_ID as PROVIDER_ID } from 'client/containers/Provisions/Form/Create/Steps/Provider'
import { STEP_ID as CONFIGURATION_ID } from 'client/containers/Provisions/Form/Create/Steps/BasicConfiguration'
import { STEP_ID as INPUTS_ID } from 'client/containers/Provisions/Form/Create/Steps/Inputs'
import { STEP_FORM_SCHEMA } from 'client/containers/Provisions/Form/Create/Steps/Template/schema'

export const STEP_ID = 'template'

const Template = () => ({
  id: STEP_ID,
  label: T.ProvisionTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { provisionsTemplates, providers } = useOne()

    const templateSelected = data?.[0]

    const [provisionSelected, setProvision] = React.useState(
      () => templateSelected?.provision_type
    )

    const [providerSelected, setProvider] = React.useState(
      () => templateSelected?.provider
    )

    const templatesByProvisionType = useMemo(() => (
      Object.values(provisionsTemplates)
        .reduce((res, { provisions }) => ({
          ...res,
          ...groupBy(Object.values(provisions)?.flat(), 'provision_type')
        }), {})
    ), [])

    const templatesByProvider = useMemo(() => (
      groupBy(templatesByProvisionType[provisionSelected] ?? [], 'provider')
    ), [provisionSelected])

    const templatesAvailable = templatesByProvider?.[providerSelected] ?? []
    const provisionDescription = provisionsTemplates?.[provisionSelected]?.description

    useEffect(() => {
      const firstProvisionType = Object.keys(templatesByProvisionType)[0]
      !provisionSelected && setProvision(firstProvisionType)
    }, [])

    useEffect(() => {
      if (provisionSelected && !providerSelected) {
        const firstProviderType = Object.keys(templatesByProvider)[0]
        setProvider(firstProviderType)
      }
    }, [provisionSelected])

    const {
      handleSelect,
      handleUnselect,
      handleClear
    } = useListForm({ key: STEP_ID, setList: setFormData })

    const handleChangeProvision = evt => {
      setProvision(evt.target.value)
      setProvider(undefined)
      templateSelected && handleClear()
    }

    const handleChangeProvider = evt => {
      setProvider(evt.target.value)
      templateSelected && handleClear()
    }

    const handleClick = (template, isSelected) => {
      const { name, description, defaults, hosts } = template

      // reset rest of form when change template
      const providerName = defaults?.provision?.provider_name ?? hosts?.[0]?.provision.provider_name
      const providerFromProvisionTemplate = providers?.filter(({ NAME }) => NAME === providerName) ?? []

      setFormData({
        [PROVIDER_ID]: providerFromProvisionTemplate,
        [CONFIGURATION_ID]: { name, description },
        [INPUTS_ID]: undefined
      })

      isSelected
        ? handleUnselect(name, item => item.name === name)
        : handleSelect(template)
    }

    const RenderDescription = ({ description = '' }) => {
      const renderer = new Marked.Renderer()

      renderer.link = (href, title, text) => (
        `<a class='MuiTypography-root MuiLink-root MuiLink-underlineHover MuiTypography-colorSecondary'
          target='_blank' rel='nofollow' title='${title}' href='${href}'>${text}</a>`
      )

      const html = Marked(sanitize`${description}`, { renderer })
      return <div dangerouslySetInnerHTML={{ __html: html }} />
    }

    return (
      <>
        {/* -- SELECTORS -- */}
        <Breadcrumbs separator={<NavArrowRight />}>
          <FormControl>
            <InputLabel color='secondary' shrink id='select-provision-type-label'>
              {'Provision type'}
            </InputLabel>
            <Select
              color='secondary'
              inputProps={{ 'data-cy': 'select-provision-type' }}
              labelId='select-provision-type-label'
              native
              style={{ marginTop: '1em', minWidth: '8em' }}
              onChange={handleChangeProvision}
              value={provisionSelected}
              variant='outlined'
            >
              {Object.keys(templatesByProvisionType).map(key => (
                <option key={key} value={key}>
                  {PROVISIONS_TYPES[key]?.name ?? key}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel color='secondary' shrink id='select-provider-type-label'>
              {'Provider type'}
            </InputLabel>
            <Select
              color='secondary'
              inputProps={{ 'data-cy': 'select-provider-type' }}
              labelId='select-provider-type-label'
              native
              style={{ marginTop: '1em', minWidth: '8em' }}
              onChange={handleChangeProvider}
              value={providerSelected}
              variant='outlined'
            >
              {Object.keys(templatesByProvider).map(key => (
                <option key={key} value={key}>
                  {PROVIDERS_TYPES[key]?.name ?? key}
                </option>
              ))}
            </Select>
          </FormControl>
        </Breadcrumbs>

        {/* -- DESCRIPTION -- */}
        {React.useMemo(() => provisionDescription && (
          <RenderDescription description={provisionDescription} />
        ), [provisionDescription])}

        <Divider style={{ margin: '1rem 0' }} />

        {/* -- LIST -- */}
        <ListCards
          keyProp='name'
          list={templatesAvailable}
          gridProps={{ 'data-cy': 'provisions-templates' }}
          CardComponent={ProvisionTemplateCard}
          cardsProps={({ value = {} }) => {
            const isSelected = data?.some(selected => selected.name === value.name)

            const isValid = ProvisionTemplateModel.isValidProvisionTemplate(value)

            return {
              isSelected,
              isValid,
              handleClick: () => handleClick(value, isSelected)
            }
          }}
        />
      </>
    )
  }, [])
})

export default Template

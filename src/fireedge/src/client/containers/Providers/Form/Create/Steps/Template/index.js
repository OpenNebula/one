import React, { useCallback, useEffect, useMemo } from 'react'
import { Divider, Select, Breadcrumbs, InputLabel, FormControl } from '@material-ui/core'
import ArrowIcon from '@material-ui/icons/ArrowForwardIosRounded'
import Marked from 'marked'

import { useProvision, useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { ProvisionTemplateCard } from 'client/components/Cards'
import { sanitize, groupBy } from 'client/utils'
import * as ProviderTemplateModel from 'client/models/ProviderTemplate'
import { T, PROVISIONS_TYPES, PROVIDERS_TYPES } from 'client/constants'

import { STEP_FORM_SCHEMA } from 'client/containers/Providers/Form/Create/Steps/Template/schema'

import { STEP_ID as CONFIGURATION_ID } from 'client/containers/Providers/Form/Create/Steps/BasicConfiguration'
import { STEP_ID as CONNECTION_ID } from 'client/containers/Providers/Form/Create/Steps/Connection'

export const STEP_ID = 'template'

const Template = () => ({
  id: STEP_ID,
  label: T.ProviderTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(
    ({ data, setFormData }) => {
      const { provisionsTemplates } = useProvision()
      const templateSelected = data?.[0]

      const [provisionSelected, setProvision] = React.useState(
        () => templateSelected?.plain?.provision_type
      )

      const [providerSelected, setProvider] = React.useState(
        () => templateSelected?.provider
      )

      const templatesByProvisionType = useMemo(() => (
        Object.values(provisionsTemplates)
          .reduce((res, { providers }) => ({
            ...res,
            ...groupBy(Object.values(providers)?.flat(), 'plain.provision_type')
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
        const { name, description } = template

        // reset rest of form when change template
        setFormData({
          [CONFIGURATION_ID]: { name, description },
          [CONNECTION_ID]: {}
        })

        isSelected
          ? handleUnselect(name, item => item.name === name)
          : handleSelect(template)
      }

      const RenderDescription = ({ description = '' }) => {
        const renderer = new Marked.Renderer()

        renderer.link = (href, title, text) => (
          `<a class="MuiTypography-root MuiLink-root MuiLink-underlineHover MuiTypography-colorSecondary"
            target="_blank" rel="nofollow" title='${title}' href='${href}'>${text}</a>`
        )

        const html = Marked(sanitize`${description}`, { renderer })
        return <div dangerouslySetInnerHTML={{ __html: html }} />
      }

      return (
        <>
          {/* -- SELECTORS -- */}
          <Breadcrumbs separator={<ArrowIcon color="secondary" />}>
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
            gridProps={{ 'data-cy': 'providers-templates' }}
            CardComponent={ProvisionTemplateCard}
            cardsProps={({ value = {} }) => {
              const isSelected = data?.some(selected => selected.name === value.name)
              const isValid = ProviderTemplateModel.isValidProviderTemplate(value)

              return {
                isProvider: true,
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

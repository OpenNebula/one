import React, { useCallback } from 'react'
import { Divider, Select, Breadcrumbs } from '@material-ui/core'
import ArrowIcon from '@material-ui/icons/ArrowForwardIosRounded'
import Marked from 'marked'

import { useProvision, useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionTemplateCard } from 'client/components/Cards'
import { sanitize } from 'client/utils'
import * as ProviderTemplateModel from 'client/models/ProviderTemplate'
import { T } from 'client/constants'

import { STEP_ID as CONFIGURATION_ID } from 'client/containers/Providers/Form/Create/Steps/BasicConfiguration'
import { STEP_ID as CONNECTION_ID } from 'client/containers/Providers/Form/Create/Steps/Connection'
import { STEP_FORM_SCHEMA } from 'client/containers/Providers/Form/Create/Steps/Template/schema'

export const STEP_ID = 'template'

const Template = () => ({
  id: STEP_ID,
  label: T.ProviderTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(
    ({ data, setFormData }) => {
      const templateSelected = data?.[0]

      const [provisionSelected, setProvision] = React.useState(() => templateSelected?.plain?.provision_type)
      const [providerSelected, setProvider] = React.useState(() => templateSelected?.provider)

      const { provisionsTemplates } = useProvision()
      const provisionSelectedDescription = provisionsTemplates?.[provisionSelected]?.description
      const providersTypes = provisionsTemplates?.[provisionSelected]?.providers ?? []
      const templatesAvailable = providersTypes?.[providerSelected]

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
        const { name, description, plain = {}, connection } = template
        const { location_key: locationKey = '' } = plain
        const { [locationKey]: _, ...connectionEditable } = connection

        // reset rest of form when change template
        setFormData({ [CONFIGURATION_ID]: { name, description }, [CONNECTION_ID]: connectionEditable })

        isSelected
          ? handleUnselect(name, item => item.name === name)
          : handleSelect(template)
      }

      const RenderOptions = ({ options = {} }) => Object.keys(options)?.map(option => (
        <option key={option} value={option}>{option}</option>
      ))

      const RenderDescription = ({ description = '' }) => {
        const renderer = new Marked.Renderer()

        renderer.link = (href, title, text) => (
          `<a class="MuiTypography-root MuiLink-root MuiLink-underlineHover MuiTypography-colorSecondary"
            target="_blank" rel="nofollow" title='${title}' href='${href}' >${text}</a>`
        )

        const html = Marked(sanitize`${description}`, { renderer })
        return <div dangerouslySetInnerHTML={{ __html: html }} />
      }

      return (
        <>
          {/* -- SELECTORS -- */}
          <Breadcrumbs separator={<ArrowIcon color="secondary" />}>
            <Select
              color='secondary'
              inputProps = {{ 'data-cy': 'select-provision-type' }}
              native
              style={{ minWidth: '8em' }}
              onChange={handleChangeProvision}
              value={provisionSelected}
              variant='outlined'
            >
              <option value="">{T.None}</option>
              <RenderOptions options={provisionsTemplates} />
            </Select>
            {provisionSelected && <Select
              color='secondary'
              inputProps = {{ 'data-cy': 'select-provider-type' }}
              native
              style={{ minWidth: '8em' }}
              onChange={handleChangeProvider}
              value={providerSelected}
              variant='outlined'
            >
              <option value="">{T.None}</option>
              <RenderOptions options={providersTypes} />
            </Select>}
          </Breadcrumbs>

          {/* -- DESCRIPTION -- */}
          {React.useMemo(() => provisionSelectedDescription && (
            <RenderDescription description={provisionSelectedDescription} />
          ), [provisionSelectedDescription])}

          <Divider style={{ margin: '1rem 0' }} />

          {/* -- LIST -- */}
          <ListCards
            keyProp='name'
            list={templatesAvailable}
            EmptyComponent={
              <EmptyCard title={
                !provisionSelected
                  ? 'Please choose your provision type'
                  : !providerSelected
                    ? 'Please choose your provider type'
                    : 'Your providers templates list is empty'
              } />
            }
            gridProps={{ 'data-cy': 'providers-templates' }}
            CardComponent={ProvisionTemplateCard}
            cardsProps={({ value = {} }) => {
              const isSelected = data?.some(selected =>
                selected.name === value.name
              )

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

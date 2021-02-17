import React, { useCallback } from 'react'
import { Divider, Select, Breadcrumbs, Link } from '@material-ui/core'
import ArrowIcon from '@material-ui/icons/ArrowForwardIosRounded'

import { useProvision, useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionTemplateCard } from 'client/components/Cards'
import { isExternalURL, sanitize } from 'client/utils'
import * as ProvisionTemplateModel from 'client/models/ProvisionTemplate'
import { T } from 'client/constants'

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
    const templateSelected = data?.[0]

    const [provisionSelected, setProvision] = React.useState(templateSelected?.provision_type)
    const [providerSelected, setProvider] = React.useState(templateSelected?.provider)

    const { provisionsTemplates, providers } = useProvision()
    const provisionSelectedDescription = provisionsTemplates?.[provisionSelected]?.description
    const providersTypes = provisionsTemplates?.[provisionSelected]?.provisions ?? []
    const templatesAvailable = providersTypes?.[providerSelected] ?? []

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
      const providerFromProvisionTemplate = providers?.find(({ NAME }) => NAME === providerName) ?? {}

      setFormData({
        [PROVIDER_ID]: [providerFromProvisionTemplate],
        [CONFIGURATION_ID]: { name, description },
        [INPUTS_ID]: undefined
      })

      isSelected
        ? handleUnselect(name, item => item.name === name)
        : handleSelect(template)
    }

    const RenderOptions = ({ options = {} }) => Object.keys(options)?.map(option => (
      <option key={option} value={option}>{option}</option>
    ))

    const RenderDescription = ({ description = '' }) => (
      <p>{(sanitize`${description}`)?.split(' ').map((string, idx) =>
        isExternalURL(string)
          ? <Link key={`link-${idx}`} color='textPrimary' target='_blank' href={string}>{string}</Link>
          : ` ${string}`
      )}</p>
    )

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
                  : 'Your provisions templates list is empty'
            } />
          }
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

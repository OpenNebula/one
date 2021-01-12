import React, { useCallback } from 'react'
import { Divider, Select, Breadcrumbs } from '@material-ui/core'
import ArrowIcon from '@material-ui/icons/ArrowForwardIosRounded'

import { useProvision, useListForm, useGeneral } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionTemplateCard } from 'client/components/Cards'
import { T } from 'client/constants'

import { STEP_ID as PROVIDER_ID } from 'client/containers/Provisions/Form/Create/Steps/Provider'
import { STEP_ID as INPUTS_ID } from 'client/containers/Provisions/Form/Create/Steps/Inputs'
import { STEP_FORM_SCHEMA } from 'client/containers/Provisions/Form/Create/Steps/Template/schema'

export const STEP_ID = 'template'

const Template = () => ({
  id: STEP_ID,
  label: T.ProvisionTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const templateSelected = data?.[0]

    const [provisionSelected, setProvision] = React.useState(templateSelected?.provision)
    const [providerSelected, setProvider] = React.useState(templateSelected?.provider)

    const { showError } = useGeneral()
    const { provisionsTemplates, providers } = useProvision()
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
      const { name, provision_type: provisionType, provider, defaults, hosts } = template

      if ([name, provisionType, provider].includes(undefined)) {
        showError({ message: 'This template has bad format. Ask your cloud administrator' })
      } else {
        // reset rest of form when change template
        const providerName = defaults?.provision?.provider_name ?? hosts?.[0]?.provision.provider_name
        const { ID } = providers?.find(({ NAME }) => NAME === providerName) ?? {}
        setFormData({ [INPUTS_ID]: undefined, [PROVIDER_ID]: [ID] })

        isSelected
          ? handleUnselect(name, item => item.name === name)
          : handleSelect({ name, provider, provision: provisionType })
      }
    }

    const RenderOptions = ({ options = {} }) => Object.keys(options)?.map(option => (
      <option key={option} value={option}>{option}</option>
    ))

    return (
      <>
        <Breadcrumbs separator={<ArrowIcon color="secondary" />}>
          <Select
            color='secondary'
            data-cy='select-provision-type'
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
            data-cy='select-provider-type'
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
        <Divider style={{ margin: '1rem 0' }} />
        <ListCards
          keyProp='name'
          list={templatesAvailable}
          EmptyComponent={
            <EmptyCard title={'Your providers templates list is empty'} />
          }
          CardComponent={ProvisionTemplateCard}
          cardsProps={({ value = {} }) => {
            const isSelected = data?.some(selected =>
              selected.name === value.name
            )

            return {
              isSelected,
              handleClick: () => handleClick(value, isSelected)
            }
          }}
        />
      </>
    )
  }, [])
})

export default Template

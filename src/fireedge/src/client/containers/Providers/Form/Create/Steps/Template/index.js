import React, { useCallback } from 'react'

import { useProvision, useListForm, useGeneral } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionTemplateCard } from 'client/components/Cards'
import { T } from 'client/constants'

import { STEP_ID as CONNECTION_ID } from 'client/containers/Providers/Form/Create/Steps/Connection'
import { STEP_ID as INPUTS_ID } from 'client/containers/Providers/Form/Create/Steps/Inputs'
import { STEP_FORM_SCHEMA } from 'client/containers/Providers/Form/Create/Steps/Template/schema'
import { Divider, Select } from '@material-ui/core'

export const STEP_ID = 'template'

const Template = () => ({
  id: STEP_ID,
  label: T.ProviderTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const templateSelected = data?.[0]

    const [provisionSelected, setProvision] = React.useState(templateSelected?.provision)
    const [providerSelected, setProvider] = React.useState(templateSelected?.provider)

    const { showError } = useGeneral()
    const { provisionsTemplates } = useProvision()
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

    const handleClick = ({ name, provider, provision }, isSelected) => {
      if (name === undefined || provider === undefined || provision === undefined) {
        showError({ message: 'This template has bad format. Ask your cloud administrator' })
      } else {
        setFormData({ [INPUTS_ID]: undefined, [CONNECTION_ID]: undefined })

        isSelected
          ? handleUnselect(name, item => item.name === name)
          : handleSelect({ name, provider, provision })
      }
    }

    const RenderOptions = ({ options = {} }) => Object.keys(options)?.map(option => (
      <option key={option} value={option}>{option}</option>
    ))

    return (
      <>
        <div>
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
        </div>
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
              isProvider: true,
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

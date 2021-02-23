import React, { useCallback } from 'react'
import { useWatch } from 'react-hook-form'

import { useProvision, useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionCard } from 'client/components/Cards'
import { T } from 'client/constants'

import { STEP_ID as INPUTS_ID } from 'client/containers/Provisions/Form/Create/Steps/Inputs'
import { STEP_ID as TEMPLATE_ID } from 'client/containers/Provisions/Form/Create/Steps/Template'
import { STEP_FORM_SCHEMA } from 'client/containers/Provisions/Form/Create/Steps/Provider/schema'

export const STEP_ID = 'provider'

const Provider = () => ({
  id: STEP_ID,
  label: T.Provider,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { providers } = useProvision()
    const provisionTemplate = useWatch({ name: TEMPLATE_ID })
    const provisionTemplateSelected = provisionTemplate?.[0] ?? {}

    const providersByTypeAndService = React.useMemo(() =>
      providers.filter(({ TEMPLATE: { PLAIN = {} } = {} }) =>
        PLAIN.provider === provisionTemplateSelected.provider &&
        PLAIN.provision_type === provisionTemplateSelected.provision_type
      )
    , [])

    const {
      handleSelect,
      handleUnselect
    } = useListForm({ key: STEP_ID, setList: setFormData })

    const handleClick = (provider, isSelected) => {
      const { ID } = provider

      // reset inputs when selected provider changes
      setFormData(prev => ({ ...prev, [INPUTS_ID]: undefined }))

      isSelected
        ? handleUnselect(ID, item => item.ID !== ID)
        : handleSelect(provider)
    }

    return (
      <ListCards
        list={providersByTypeAndService}
        EmptyComponent={<EmptyCard title={'Your providers list is empty'} />}
        CardComponent={ProvisionCard}
        gridProps={{ 'data-cy': 'providers' }}
        cardsProps={({ value = {} }) => {
          const isSelected = data?.some(selected => selected.ID === value.ID)

          return {
            isProvider: true,
            isSelected,
            handleClick: () => handleClick(value, isSelected)
          }
        }}
        breakpoints={{ xs: 12, sm: 6, md: 4 }}
      />
    )
  }, [])
})

export default Provider

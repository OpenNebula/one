import React, { useCallback, useEffect } from 'react'
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
    const template = useWatch({ name: TEMPLATE_ID })
    const templateSelected = template?.[0] ?? {}

    const providersByTypeAndService = React.useMemo(() =>
      providers.filter(({ TEMPLATE: { PLAIN = {} } = {} }) =>
        PLAIN.provider === templateSelected.provider &&
        PLAIN.provision_type === templateSelected.provision
      )
    , [providers])

    const {
      handleSelect,
      handleUnselect
    } = useListForm({ key: STEP_ID, setList: setFormData })

    useEffect(() => {
      // delete provider selected at template if not exists
      const existsProvider = providers?.some(({ ID }) => ID === data?.[0])
      !existsProvider && handleUnselect(data?.[0])
    }, [])

    const handleClick = (id, isSelected) => {
      // reset inputs when change provider
      setFormData(prev => ({ ...prev, [INPUTS_ID]: undefined }))
      isSelected ? handleUnselect(id) : handleSelect(id)
    }

    return (
      <ListCards
        list={providersByTypeAndService}
        EmptyComponent={<EmptyCard title={'Your providers list is empty'} />}
        CardComponent={ProvisionCard}
        cardsProps={({ value: { ID } }) => {
          const isSelected = data?.some(selected => selected === ID)

          return {
            isProvider: true,
            isSelected,
            handleClick: () => handleClick(ID, isSelected)
          }
        }}
        breakpoints={{ xs: 12, sm: 6, md: 4 }}
      />
    )
  }, [])
})

export default Provider

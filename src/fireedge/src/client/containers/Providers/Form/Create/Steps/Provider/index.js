import React, { useCallback, useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import { useFetch, useProvision, useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionTemplateCard } from 'client/components/Cards'
import { PATH } from 'client/router/provision'
import { T } from 'client/constants'

import { STEP_ID as CONNECTION_ID } from 'client/containers/Providers/Form/Create/Steps/Connection'
import { STEP_ID as LOCATION_ID } from 'client/containers/Providers/Form/Create/Steps/Locations'
import { STEP_FORM_SCHEMA } from 'client/containers/Providers/Form/Create/Steps/Provider/schema'

export const STEP_ID = 'provider'

const Provider = () => ({
  id: STEP_ID,
  label: T.ProviderTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { getProvidersTemplates } = useProvision()
    const { data: templates, fetchRequest, loading, error } = useFetch(
      getProvidersTemplates
    )

    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => { fetchRequest() }, [])

    const handleClick = (nameTemplate, isSelected) => {
      setFormData({ [LOCATION_ID]: undefined, [CONNECTION_ID]: undefined })
      isSelected ? handleUnselect(nameTemplate) : handleSelect(nameTemplate)
    }

    if (error) {
      return <Redirect to={PATH.DASHBOARD} />
    }

    return (
      <ListCards
        list={templates}
        keyProp='name'
        isLoading={!templates || loading}
        EmptyComponent={
          <EmptyCard title={'Your providers templates list is empty'} />
        }
        CardComponent={ProvisionTemplateCard}
        cardsProps={({ value: { name } }) => {
          const isSelected = data?.some(selected => selected === name)

          return {
            isProvider: true,
            isSelected,
            handleClick: () => handleClick(name, isSelected)
          }
        }}
        breakpoints={{ xs: 12, sm: 6, md: 4 }}
      />
    )
  }, [])
})

export default Provider

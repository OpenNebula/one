import React, { useCallback, useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import { useFetch, useProvision, useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionCard } from 'client/components/Cards'
import { PATH } from 'client/router/provision'
import { T } from 'client/constants'

import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'provider'

const Provider = () => ({
  id: STEP_ID,
  label: T.Provider,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { getProviders } = useProvision()
    const { data: providers, fetchRequest, loading, error } = useFetch(
      getProviders
    )

    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => { fetchRequest() }, [])

    useEffect(() => {
      if (providers) {
        // delete provider selected in template if not exists
        const provider = providers?.some(({ NAME }) => NAME === data?.[0])
        !provider && handleUnselect(data?.[0])
      }
    }, [providers])

    if (error) {
      return <Redirect to={PATH.DASHBOARD} />
    }

    return (
      <ListCards
        list={providers}
        isLoading={!providers && loading}
        EmptyComponent={<EmptyCard title={'Your providers list is empty'} />}
        CardComponent={ProvisionCard}
        cardsProps={({ value: { NAME } }) => {
          const isSelected = data?.some(selected => selected === NAME)

          return {
            imgAsAvatar: true,
            isProvider: true,
            isSelected,
            handleClick: () =>
              isSelected ? handleUnselect(NAME) : handleSelect(NAME)
          }
        }}
        breakpoints={{ xs: 12, sm: 6, md: 4 }}
      />
    )
  }, [])
})

export default Provider

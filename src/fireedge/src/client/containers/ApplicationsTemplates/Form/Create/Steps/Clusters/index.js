import React, { useEffect, useCallback } from 'react'

import useOpennebula from 'client/hooks/useOpennebula'

import useListForm from 'client/hooks/useListForm'
import ListCards from 'client/components/List/ListCards'
import { ClusterCard, EmptyCard } from 'client/components/Cards'

import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'clusters'

const Clusters = () => ({
  id: STEP_ID,
  label: 'Where will it run?',
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { clusters, getClusters } = useOpennebula()
    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => {
      getClusters()
    }, [])

    return (
      <ListCards
        list={clusters}
        EmptyComponent={<EmptyCard name={'clusters'} />}
        CardComponent={ClusterCard}
        cardsProps={({ value: { ID } }) => {
          const isSelected = data?.some(selected => selected === ID)
          const handleClick = () => isSelected ? handleUnselect(ID) : handleSelect(ID)

          return { isSelected, handleClick }
        }}
      />
    )
  }, [])
})

export default Clusters

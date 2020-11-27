import React, { useEffect, useCallback } from 'react'

import useOpennebula from 'client/hooks/useOpennebula'
import useListForm from 'client/hooks/useListForm'
import useFetch from 'client/hooks/useFetch'

import ListCards from 'client/components/List/ListCards'
import { ClusterCard, EmptyCard } from 'client/components/Cards'

import { STEP_FORM_SCHEMA } from './schema'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

export const STEP_ID = 'clusters'

const Clusters = () => ({
  id: STEP_ID,
  label: Tr(T.WhereWillItRun),
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { clusters, getClusters } = useOpennebula()
    const { fetchRequest, loading } = useFetch(getClusters)
    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => {
      fetchRequest()
    }, [])

    return (
      <ListCards
        list={clusters}
        isLoading={clusters.length === 0 && loading}
        EmptyComponent={<EmptyCard title={'Your clusters list is empty'} />}
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

import React, { useCallback, useContext } from 'react'

import { useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { ApplicationNetworkCard } from 'client/components/Cards'

import { STEP_ID as NETWORKING } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Networking'
import { Context } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'networks'

const Networks = () => ({
  id: STEP_ID,
  label: Tr(T.Networks),
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { nestedForm: list } = useContext(Context)
    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      multiple: true,
      setList: setFormData
    })

    return (
      <ListCards
        list={list[NETWORKING]}
        CardComponent={ApplicationNetworkCard}
        cardsProps={({ value: { id, name } }) => {
          const isSelected = data?.some(selected => selected === id)

          return {
            title: name,
            isSelected,
            handleClick: () => isSelected ? handleUnselect(id) : handleSelect(id)
          }
        }}
      />
    )
  }, [])
})

export default Networks

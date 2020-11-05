import React, { useCallback, useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import { LinearProgress } from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'

import useFetch from 'client/hooks/useFetch'
import useProvision from 'client/hooks/useProvision'
import useListForm from 'client/hooks/useListForm'

import ListCards from 'client/components/List/ListCards'
import { EmptyCard, SelectCard } from 'client/components/Cards'
import { PATH } from 'client/router/provision'

import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'provider'

const Provider = () => ({
  id: STEP_ID,
  label: 'Provider Template',
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
      setFormData({ location: undefined, connection: undefined })
      isSelected ? handleUnselect(nameTemplate) : handleSelect(nameTemplate)
    }

    if (error) {
      return <Redirect to={PATH.DASHBOARD} />
    }

    return (!templates || loading) ? (
      <LinearProgress />
    ) : (
      <ListCards
        list={templates}
        EmptyComponent={<EmptyCard name={'providers templates'} />}
        CardComponent={SelectCard}
        cardsProps={({ value: { name } }) => {
          const isSelected = data?.some(selected => selected === name)

          return {
            icon: <FileIcon />,
            title: name,
            isSelected,
            handleClick: () => handleClick(name, isSelected)
          }
        }}
      />
    )
  }, [])
})

export default Provider

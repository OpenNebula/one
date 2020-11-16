import React, { useCallback, useEffect } from 'react'

import { Redirect } from 'react-router-dom'
import ProvisionTemplateIcon from '@material-ui/icons/Telegram'

import useFetch from 'client/hooks/useFetch'
import useProvision from 'client/hooks/useProvision'
import useListForm from 'client/hooks/useListForm'

import ListCards from 'client/components/List/ListCards'
import { EmptyCard, SelectCard } from 'client/components/Cards'
import { PATH } from 'client/router/provision'

import { STEP_ID as INPUTS_ID } from 'client/containers/Provisions/Form/Create/Steps/Inputs'
import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'provisionTemplate'

const ProvisionTemplate = () => ({
  id: STEP_ID,
  label: 'Provision template',
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { provisionsTemplates, getProvisionsTemplates } = useProvision()
    const { fetchRequest, cancelRequest, loading, error } = useFetch(getProvisionsTemplates)

    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => {
      data?.length === 0 && fetchRequest()

      return () => {
        cancelRequest()
      }
    }, [])

    const handleClick = (nameTemplate, isSelected) => {
      setFormData(prev => ({ ...prev, [INPUTS_ID]: undefined }))
      isSelected ? handleUnselect(nameTemplate) : handleSelect(nameTemplate)
    }

    if (error) {
      return <Redirect to={PATH.DASHBOARD} />
    }

    return (
      <ListCards
        list={provisionsTemplates}
        isLoading={provisionsTemplates.length === 0 && loading}
        EmptyComponent={<EmptyCard title={'Your provisions templates list is empty'} />}
        CardComponent={SelectCard}
        cardsProps={({ value: { ID, NAME } }) => {
          const isSelected = data?.some(selected => selected === ID)

          return {
            icon: <ProvisionTemplateIcon />,
            title: `${ID} - ${NAME}`,
            isSelected,
            handleClick: () => handleClick(ID, isSelected)
          }
        }}
      />
    )
  }, [])
})

export default ProvisionTemplate

import React, { useCallback, useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import useFetch from 'client/hooks/useFetch'
import useProvision from 'client/hooks/useProvision'
import useListForm from 'client/hooks/useListForm'

import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionTemplateCard } from 'client/components/Cards'
import { PATH } from 'client/router/provision'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import { STEP_ID as INPUTS_ID } from 'client/containers/Provisions/Form/Create/Steps/Inputs'
import { STEP_ID as PROVIDER_ID } from 'client/containers/Provisions/Form/Create/Steps/Provider'
import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'provision'

const Provision = () => ({
  id: STEP_ID,
  label: Tr(T.ProvisionTemplate),
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { getProvisionsTemplates } = useProvision()
    const { data: templates, fetchRequest, loading, error } = useFetch(
      getProvisionsTemplates
    )

    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => { fetchRequest() }, [])

    const handleClick = (nameTemplate, nameProvider, isSelected) => {
      setFormData(({ [INPUTS_ID]: undefined, [PROVIDER_ID]: [nameProvider] }))
      isSelected ? handleUnselect(nameTemplate) : handleSelect(nameTemplate)
    }

    if (error) {
      return <Redirect to={PATH.DASHBOARD} />
    }

    return (
      <ListCards
        list={templates}
        keyProp='name'
        isLoading={!templates && loading}
        EmptyComponent={
          <EmptyCard title={'Your provisions templates list is empty'} />
        }
        CardComponent={ProvisionTemplateCard}
        cardsProps={({ value: { name, defaults = {} } }) => {
          const isSelected = data?.some(selected => selected === name)
          const { provision: { provider } = {} } = defaults

          return {
            isSelected,
            handleClick: () => handleClick(name, provider, isSelected)
          }
        }}
        breakpoints={{ xs: 12, sm: 6, md: 4 }}
      />
    )
  }, [])
})

export default Provision

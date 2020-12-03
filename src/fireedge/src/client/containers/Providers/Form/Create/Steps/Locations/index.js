import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'

import { useProvision, useListForm } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, LocationCard } from 'client/components/Cards'
import { T } from 'client/constants'

import { STEP_ID as PROVIDER_ID } from 'client/containers/Providers/Form/Create/Steps/Provider'
import { STEP_FORM_SCHEMA } from 'client/containers/Providers/Form/Create/Steps/Locations/schema'

export const STEP_ID = 'location'

const Locations = () => ({
  id: STEP_ID,
  label: T.Location,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const [locationsList, setLocationsList] = useState([])
    const { providersTemplates } = useProvision()
    const { watch } = useFormContext()

    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      setList: setFormData
    })

    useEffect(() => {
      const { [PROVIDER_ID]: selectedProvider } = watch()

      const provider = providersTemplates
        .find(({ name }) => name === selectedProvider?.[0]) ?? {}

      setLocationsList(
        Object.entries(provider?.locations)
          ?.map(([key, properties]) => ({ key, properties })) ?? []
      )
    }, [])

    return (
      <ListCards
        list={locationsList}
        keyProp='key'
        EmptyComponent={<EmptyCard title={'Your locations list is empty'} />}
        CardComponent={LocationCard}
        cardsProps={({ value: { key } }) => {
          const isSelected = data?.some(selected => selected === key)
          const handleClick = () =>
            isSelected ? handleUnselect(key) : handleSelect(key)

          return { isSelected, handleClick }
        }}
      />
    )
  }, [])
})

export default Locations

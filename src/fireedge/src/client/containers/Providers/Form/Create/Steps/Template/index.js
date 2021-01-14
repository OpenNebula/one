import React, { useCallback } from 'react'
import { Divider, Select, Breadcrumbs, Link } from '@material-ui/core'
import ArrowIcon from '@material-ui/icons/ArrowForwardIosRounded'

import { useProvision, useListForm, useGeneral } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { EmptyCard, ProvisionTemplateCard } from 'client/components/Cards'
import { isExternalURL, sanitize } from 'client/utils'
import { T } from 'client/constants'

import { STEP_ID as CONFIGURATION_ID } from 'client/containers/Providers/Form/Create/Steps/BasicConfiguration'
import { STEP_ID as CONNECTION_ID } from 'client/containers/Providers/Form/Create/Steps/Connection'
import { STEP_FORM_SCHEMA } from 'client/containers/Providers/Form/Create/Steps/Template/schema'

export const STEP_ID = 'template'

const Template = () => ({
  id: STEP_ID,
  label: T.ProviderTemplate,
  resolver: () => STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const templateSelected = data?.[0]

    const [provisionSelected, setProvision] = React.useState(templateSelected?.provision)
    const [providerSelected, setProvider] = React.useState(templateSelected?.provider)

    const { showError } = useGeneral()
    const { provisionsTemplates } = useProvision()
    const provisionSelectedDescription = provisionsTemplates?.[provisionSelected]?.description
    const providersTypes = provisionsTemplates?.[provisionSelected]?.providers ?? []
    const templatesAvailable = providersTypes?.[providerSelected]

    const {
      handleSelect,
      handleUnselect,
      handleClear
    } = useListForm({ key: STEP_ID, setList: setFormData })

    const handleChangeProvision = evt => {
      setProvision(evt.target.value)
      setProvider(undefined)
      templateSelected && handleClear()
    }

    const handleChangeProvider = evt => {
      setProvider(evt.target.value)
      templateSelected && handleClear()
    }

    const handleClick = ({ name, description, provider, plain = {} }, isSelected) => {
      const { provision_type: provisionType } = plain

      if ([name, provisionType, provider].includes(undefined)) {
        showError({ message: 'This template has bad format. Ask your cloud administrator' })
      } else {
        // reset rest of form when change template
        setFormData({ [CONFIGURATION_ID]: { name, description }, [CONNECTION_ID]: undefined })

        isSelected
          ? handleUnselect(name, item => item.name === name)
          : handleSelect({ name, provider, provision: provisionType })
      }
    }

    const RenderOptions = ({ options = {} }) => Object.keys(options)?.map(option => (
      <option key={option} value={option}>{option}</option>
    ))

    const RenderDescription = ({ description = '' }) => (
      <p>{(sanitize`${description}`)?.split(' ').map((string, idx) =>
        isExternalURL(string)
          ? <Link key={`link-${idx}`} color='textPrimary' href={string}>{string}</Link>
          : ` ${string}`
      )}</p>
    )

    return (
      <>
        {/* -- SELECTORS -- */}
        <Breadcrumbs separator={<ArrowIcon color="secondary" />}>
          <Select
            color='secondary'
            data-cy='select-provision-type'
            native
            style={{ minWidth: '8em' }}
            onChange={handleChangeProvision}
            value={provisionSelected}
            variant='outlined'
          >
            <option value="">{T.None}</option>
            <RenderOptions options={provisionsTemplates} />
          </Select>
          {provisionSelected && <Select
            color='secondary'
            data-cy='select-provider-type'
            native
            style={{ minWidth: '8em' }}
            onChange={handleChangeProvider}
            value={providerSelected}
            variant='outlined'
          >
            <option value="">{T.None}</option>
            <RenderOptions options={providersTypes} />
          </Select>}
        </Breadcrumbs>

        {/* -- DESCRIPTION -- */}
        {React.useMemo(() => provisionSelectedDescription && (
          <RenderDescription description={provisionSelectedDescription} />
        ), [provisionSelectedDescription])}

        <Divider style={{ margin: '1rem 0' }} />

        {/* -- LIST -- */}
        <ListCards
          keyProp='name'
          list={templatesAvailable}
          EmptyComponent={
            <EmptyCard title={
              !provisionSelected
                ? 'Please choose your provision type'
                : !providerSelected
                  ? 'Please choose your provider type'
                  : 'Your providers templates list is empty'
            } />
          }
          CardComponent={ProvisionTemplateCard}
          cardsProps={({ value = {} }) => {
            const isSelected = data?.some(selected =>
              selected.name === value.name
            )

            return {
              isProvider: true,
              isSelected,
              handleClick: () => handleClick(value, isSelected)
            }
          }}
        />
      </>
    )
  }, [])
})

export default Template

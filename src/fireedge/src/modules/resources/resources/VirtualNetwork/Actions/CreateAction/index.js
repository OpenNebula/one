/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { ReactElement, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Network, Page } from 'iconoir-react'

import { CreateTypeDialog } from '@ComponentsV2Module'
import { useTranslation } from '@ProvidersModule'
import { T, PATH } from '@ConstantsModule'
import { SelectTemplateForm } from '@modules/resources/resources/VnTemplate/Forms'
import { useModalsApi } from '@FeaturesModule'

export const VIRTUAL_NETWORK_CREATE_TYPES = {
  SCRATCH: 'SCRATCH',
  TEMPLATE: 'TEMPLATE',
}

const VIRTUAL_NETWORK_CREATE_OPTIONS = [
  {
    value: VIRTUAL_NETWORK_CREATE_TYPES.SCRATCH,
    dataCy: 'vnet-create-scratch',
    icon: Network,
    title: T['vnet.create.scratch.title'],
    subtitle: T['vnet.create.scratch.subtitle'],
  },
  {
    value: VIRTUAL_NETWORK_CREATE_TYPES.TEMPLATE,
    dataCy: 'vnet-create-template',
    icon: Page,
    title: T['vnet.create.template.title'],
    subtitle: T['vnet.create.template.subtitle'],
  },
]

const TEMPLATE_SELECTION_DIALOG_PROPS = {
  dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogContentMaxHeight: '70vh',
}

/**
 * Create Virtual Network Action.
 *
 * @returns {ReactElement} - Create Virtual Network Action component
 */
export const CreateAction = () => {
  const { translate } = useTranslation()
  const history = useHistory()
  const { showModal } = useModalsApi()
  const selectedTemplateRef = useRef()
  const [selectedType, setSelectedType] = useState(
    VIRTUAL_NETWORK_CREATE_TYPES.SCRATCH
  )

  const handleCancel = () => history.push(PATH.NETWORK.VNETS.LIST)

  const handleConfirmTemplate = (template) => {
    history.replace(PATH.NETWORK.VN_TEMPLATES.INSTANTIATE, {
      ...template,
      returnTo: PATH.NETWORK.VNETS.LIST,
    })
  }

  const handleSelectTemplate = (template) => {
    selectedTemplateRef.current = template
  }

  const handleOpenTemplateSelection = () => {
    selectedTemplateRef.current = undefined

    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.SelectVirtualNetworkTemplates,
        description: <SelectTemplateForm onSelect={handleSelectTemplate} />,
        confirmLabel: T.Continue,
        cancelLabel: T.Cancel,
        ...TEMPLATE_SELECTION_DIALOG_PROPS,
      },
      onSubmit: () => {
        if (!selectedTemplateRef.current) return false

        handleConfirmTemplate(selectedTemplateRef.current)
      },
    })
  }

  const handleContinue = () => {
    switch (selectedType) {
      case VIRTUAL_NETWORK_CREATE_TYPES.SCRATCH:
        history.push(PATH.NETWORK.VNETS.CREATE, {
          createType: VIRTUAL_NETWORK_CREATE_TYPES.SCRATCH,
        })
        break
      case VIRTUAL_NETWORK_CREATE_TYPES.TEMPLATE:
        handleOpenTemplateSelection()
        break
    }
  }

  return (
    <CreateTypeDialog
      title={translate(T['vnet.create.selection.title'])}
      subtitle={translate(T['vnet.create.selection.subtitle'])}
      options={VIRTUAL_NETWORK_CREATE_OPTIONS.map(
        ({ title, subtitle, ...option }) => ({
          ...option,
          title: translate(title),
          subtitle: translate(subtitle),
        })
      )}
      selectedValue={selectedType}
      onChange={setSelectedType}
      onCancel={handleCancel}
      onConfirm={handleContinue}
      cancelLabel={translate(T.Cancel)}
      confirmLabel={translate(T.Continue)}
      cancelDataCy="vnet-create-cancel"
      confirmDataCy="vnet-create-confirm"
    />
  )
}

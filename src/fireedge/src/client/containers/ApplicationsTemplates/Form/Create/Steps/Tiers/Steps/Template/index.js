/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback, useState, useEffect, useMemo } from 'react'

import { IconButton, Button, Fade } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import {
  NavArrowLeft as BackIcon,
  SimpleCart as MarketplaceIcon,
  EmptyPage as TemplateIcon,
} from 'iconoir-react'

import { DockerLogo } from 'client/components/Icons'
import ListTemplates from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers/Steps/Template/List/Templates'
import ListMarketApps from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers/Steps/Template/List/MarketApps'
import DockerFile from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers/Steps/Template/List/Docker'
import { STEP_FORM_SCHEMA } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers/Steps/Template/schema'
import { T } from 'client/constants'

export const STEP_ID = 'template'

const SCREENS = [
  {
    id: 'id',
    button: <TemplateIcon />,
    content: ListTemplates,
  },
  {
    id: 'app',
    button: <MarketplaceIcon />,
    content: ListMarketApps,
  },
  {
    id: 'docker',
    button: <DockerLogo width="100" height="100%" color="#066da5" />,
    content: DockerFile,
  },
]

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
  wrapper: {
    height: '100%',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  button: { backgroundColor: '#fff' },
}))

const Template = () => ({
  id: STEP_ID,
  label: T.ConfigureTemplate,
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data = {}, setFormData }) => {
    const classes = useStyles()
    const [screen, setScreen] = useState(undefined)

    useEffect(() => {
      if (Object.keys(data).length > 0) {
        const currentScreen = Object.keys(data)[0]
        setScreen(SCREENS.find((src) => src.id === currentScreen))
      }
    }, [])

    const handleSetTemplate = (template) =>
      setFormData((prevData) => ({
        ...prevData,
        [STEP_ID]: template ? { [screen.id]: template } : undefined,
      }))

    const handleBack = () => {
      setScreen(undefined)
      handleSetTemplate()
    }

    const Content = useMemo(() => screen?.content, [screen])

    return screen !== undefined ? (
      <Content
        backButton={
          <IconButton onClick={handleBack} size="large">
            <BackIcon />
          </IconButton>
        }
        handleSetData={handleSetTemplate}
        currentValue={data[screen.id]}
      />
    ) : (
      <div className={classes.root}>
        <div className={classes.wrapper}>
          {SCREENS?.map((scr) => (
            <Fade in timeout={500} key={`option-${scr.id}`}>
              <Button
                variant="contained"
                className={classes.button}
                onClick={() => setScreen(scr)}
              >
                {scr.button}
              </Button>
            </Fade>
          ))}
        </div>
      </div>
    )
  }, []),
})

export default Template

import React, { useCallback, useState, useEffect, useMemo } from 'react'

import {
  ArrowBackIosOutlined as BackIcon,
  ShoppingCartOutlined as MarketplaceIcon,
  InsertDriveFileOutlined as TemplateIcon
} from '@material-ui/icons'
import { makeStyles, IconButton, Button, Fade } from '@material-ui/core'
import DockerLogo from 'client/icons/docker'

import ListTemplates from './List/Templates'
import ListMarketApps from './List/MarketApps'
import DockerFile from './List/Docker'
import { STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'template'

const SCREENS = [
  {
    id: 'id',
    button: <TemplateIcon style={{ fontSize: 100 }} />,
    content: ListTemplates
  },
  {
    id: 'app',
    button: <MarketplaceIcon style={{ fontSize: 100 }} />,
    content: ListMarketApps
  },
  {
    id: 'docker',
    button: <DockerLogo width="100" height="100%" color="#066da5" />,
    content: DockerFile
  }
]

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1
  },
  wrapper: {
    height: '100%',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  button: { backgroundColor: '#fff' }
}))

const Template = () => ({
  id: STEP_ID,
  label: 'Template',
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data = {}, setFormData }) => {
    const classes = useStyles()
    const [screen, setScreen] = useState(undefined)

    useEffect(() => {
      if (Object.keys(data).length > 0) {
        const currentScreen = Object.keys(data)[0]
        setScreen(SCREENS.find(src => src.id === currentScreen))
      }
    }, [])

    const handleSetTemplate = template =>
      setFormData(prevData => ({
        ...prevData,
        [STEP_ID]: template ? { [screen.id]: template } : undefined
      }))

    const handleBack = () => {
      setScreen(undefined)
      handleSetTemplate()
    }

    const Content = useMemo(() => screen?.content, [screen])

    return screen !== undefined ? (
      <Content
        backButton={
          <IconButton onClick={handleBack}>
            <BackIcon />
          </IconButton>
        }
        handleSetData={handleSetTemplate}
        currentValue={data[screen.id]}
      />
    ) : (
      <div className={classes.root}>
        <div className={classes.wrapper}>
          {SCREENS?.map(scr => (
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
  }, [])
})

export default Template

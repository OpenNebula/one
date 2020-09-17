import React from 'react';

import TemplateIcon from '@material-ui/icons/InsertDriveFileOutlined';
import MarketplaceIcon from '@material-ui/icons/ShoppingCartOutlined';
import DockerLogo from 'client/icons/docker';

import ProcessScreen from 'client/components/ProcessScreen';
import FormStep from 'client/components/FormStepper/FormStep';

import ListTemplates from './List/Templates';
import ListMarketApps from './List/MarketApps';
import DockerFile from './List/Docker';
import { STEP_FORM_SCHEMA } from './schema';

const Template = () => {
  const STEP_ID = 'template';
  const SCREENS = [
    {
      id: 'template',
      button: <TemplateIcon style={{ fontSize: 100 }} />,
      screen: ListTemplates
    },
    {
      id: 'app',
      button: <MarketplaceIcon style={{ fontSize: 100 }} />,
      screen: ListMarketApps
    },
    {
      id: 'docker',
      button: <DockerLogo width="100" height="100%" color="#066da5" />,
      screen: DockerFile
    }
  ];

  return {
    id: STEP_ID,
    label: 'Template',
    content: FormStep,
    resolver: STEP_FORM_SCHEMA,
    FormComponent: props => ProcessScreen({ screens: SCREENS, ...props })
  };
};

export default Template;

# !/usr/bin/env python
import os
import sys
import json
import logging

# Add the plugin directory to the path
plugin_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(plugin_dir)

from lib.oneform_client import OneFormClient
from lib.deployment_template import DeploymentTemplate
from ansible.plugins.inventory import BaseInventoryPlugin

class InventoryConfig:
    """Inventory configuration class"""

    USER_AUTH = os.path.expanduser('~/.one/one_auth')

    def __init__(self, path: str, config: dict, extra_vars: dict) -> None:
        self.path   = path
        self.config = config
        self.debug  = self._is_debug_enabled()
        self.logger = self._logger()

        # Extra vars
        self._load_vars(extra_vars)

        # Files
        self.provision_body       = self._get_body()
        self.deployment_file_path = self._get_dfile_path()

    # --------------------------------------------------------------
    # Private methods
    # --------------------------------------------------------------

    def _logger(self) -> logging.Logger:
        log_level = logging.DEBUG if self.debug else logging.INFO
        logging.basicConfig(level=log_level, format='%(message)s')
        logger = logging.getLogger("oneform_logger")

        logger.debug(f'Running inventory in debug mode')

        return logger

    def _load_vars(self, vars: dict) -> None:
        """Load extra variables and configuration"""
        try:
            self.form_server  = vars.get('form_server', 'localhost')
            self.one_server   = vars.get('one_server', 'localhost')
            self.one_version  = vars.get('version', None)
            self.provision_id = int(vars.get('provision_id', -1))

            if 'one_auth' in vars:
                self.one_auth = vars['one_auth']
            else:
                self.one_auth = OneFormClient.get_credentials(InventoryConfig.USER_AUTH)
        except Exception as e:
            raise RuntimeError(f'Error loading variables: {e}')

    def _get_body(self) -> dict:
        """Return provision body content"""
        if self.debug:
            # If debug mode, get the provision body from the given path
            provision_path = self.config["debug"].get("provision_body")

            if not os.path.exists(provision_path):
                raise FileNotFoundError(f'Provision body file {provision_path} not found')

            logging.debug(f'Loading provision body from {provision_path}')

            with open(provision_path, "r") as file:
                data = json.load(file)

                body       = data.get("DOCUMENT").get('TEMPLATE').get('PROVISION_BODY')
                body['id'] = int(data.get("DOCUMENT").get("ID"))

                return body
        else:
            # Get the body from the oneform server otherwise
            logging.info(f'Fetching provision {self.provision_id} from OneForm server')
            return self._fetch_provision()

    def _get_dfile_path(self) -> str:
        """Return the deployment file path"""
        if self.debug:
            # If debug mode, get the deployment file from the given path
            deployment_path = self.config["debug"].get("deployment_file")
        else:
            # If not in debug mode, self.provision_body should contains the deployment file path
            templates_dir = os.path.join(os.path.dirname(self.path), 'templates')
            deployment_file = self.provision_body.get("deployment_file")

            deployment_path = os.path.join(templates_dir, f"{deployment_file}.j2")

        if not os.path.exists(deployment_path):
                raise FileNotFoundError(f'Deployment file {deployment_path} not found')

        self.logger.info(f'Loading deployment file from {deployment_path}')

        return deployment_path

    def _is_debug_enabled(self) -> bool:
        """Check if debug is enabled in the configuration"""
        return "debug" in self.config

    def _fetch_provision(self) -> dict:
        """Fetch provision data from OneForm server"""
        try:
            client = OneFormClient(endpoint=self.form_server, auth=self.one_auth)
            return client.get_provision(self.provision_id)
        except Exception as e:
            raise RuntimeError(f'Error getting provision data: {e}')

class InventoryModule(BaseInventoryPlugin):
    """Inventory plugin for OpenNebula Form"""

    NAME = "opennebula_form"

    def verify_file(self, path):
        """Verify if the file is a valid inventory file"""
        return path.endswith(".yaml")

    def parse(self, inventory, loader, path, cache=True):
        """Load the inventory data from the jinja2 template"""
        super(InventoryModule, self).parse(inventory, loader, path, cache)

        # Load config
        config = self.load_config(path)
        config.logger.debug(f'Configuration from {path} loaded')

        try:
            # Render Jinja2 template
            dtemplate = DeploymentTemplate(
                path=config.deployment_file_path,
                provision=config.provision_body,
                logger=config.logger,
                opts={ "frontend_ip": config.one_server, "one_version": config.one_version }
            )
        except Exception as e:
            self.log_error(f'Error rendering template: {e}')

        # Create an inventory object
        config.logger.info('Generating dynamic inventory')
        self.generate_inventory(dtemplate, config.logger)

    def load_config(self, path) -> InventoryConfig:
        try:
            return InventoryConfig(
                path=path,
                config=self._read_config_data(path),
                extra_vars=self._vars
            )
        except Exception as e:
            self.log_error(f'Error loading configuration: {e}')

    def generate_inventory(self, dtemplate: DeploymentTemplate, logger: logging.Logger) -> None:
        """Generate the inventory based on the template variables"""
        try:
            # Set variables under the 'all' group
            logger.info('Adding all group variables to the inventory')
            for var_key, var_value in dtemplate.all.items():
                self.inventory.set_variable('all', var_key, var_value)

            # Ensure all groups exist
            for group in dtemplate.groups:
                logger.info(f'Creating group {group}')
                self.inventory.add_group(group)

            #  Configure each group
            for group, group_data in dtemplate.groups.items():
                logger.info(f'Configuring group {group}')

                # Add hosts to the group, if any
                group_hosts = group_data.get('hosts', {})
                for host, host_details in group_hosts.items():
                    logger.info(f'Adding host {host} to group {group}')
                    self.inventory.add_host(host, group)

                    # Set host-level variables
                    for key, value in host_details.items():
                        self.inventory.set_variable(host, key, value)

                # Set group-level variables, if any
                group_vars = group_data.get('vars', {})
                for var_key, var_value in group_vars.items():
                    self.inventory.set_variable(group, var_key, var_value)

                # Add child groups, if defined
                group_children = group_data.get('children', [])
                for child in group_children:
                    logger.info(f'Linking child group {child} under parent group {group}')
                    self.inventory.add_group(child)  # Ensure child exists
                    self.inventory.add_child(group, child)

            logger.info('Inventory generated successfully')
        except Exception as e:
            self.log_error(f'Error generating inventory: {e}')


    def log_error(self, msg: str) -> None:
        """Log an error message and exit"""
        self.display.error(msg)
        sys.exit(1)

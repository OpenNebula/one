# !/usr/bin/env python
import os
import re
import yaml
import copy
import logging

from jinja2 import Environment, FileSystemLoader

class DeploymentTemplate(Environment):
    """DeploymentTemplate class to render jinja2 templates"""

    def __init__(self, path: str, provision: dict, logger: logging.Logger, opts = {}) -> None:
        """Initialize the OneFormTemplate"""
        self.logger = logger

        # Path to the templates directory
        templates_dir = os.path.dirname(path)
        loader = FileSystemLoader(templates_dir)
        super().__init__(loader=loader)

        self.logger.debug(f'Loading templates from {templates_dir}')

        # Provision data
        self.provision = provision
        # Path to the deployment template file
        self.path = path
        # Template vars to use in the template rendering
        self.vars = self._generate_vars(opts)
        # Jinja template rendered
        self.content = self._render_template()
        # Inventory all vars group
        self.all = self.content.get('all', {}).get('vars', {})
        # Inventory groups
        self.groups = {k: v for k, v in self.content.items() if k != "all"}

    # --------------------------------------------------------------
    # Private methods
    # --------------------------------------------------------------

    def _render_template(self) -> dict:
        """Render the template with the given variables"""
        if not os.path.exists(self.path):
            raise FileNotFoundError(f'Template file {self.path} does not exist')

        # Render the j2 template using vars
        template = self.get_template(os.path.basename(self.path)).render(self.vars)
        yaml_template =  yaml.safe_load(template)

        self.logger.info('Jinja2 deploymnet template rendered successfully')

        # Replace template names and data with the ones from OneForm
        return self._update_templates(
            inventory=yaml_template,
            one_objects=self.provision['one_objects']
        )

    def _generate_vars(self, opts=None) -> dict:
        """Generate the variables to render the template"""
        opts = opts or {}

        # Deep copy to avoid modifying self.provision
        vars = copy.deepcopy(self.provision)

        one_objects  = vars.get("one_objects", {})
        frontend_ip  = opts.get("frontend_ip", "localhost")
        one_version  = opts.get("one_version", None)

        # Get IDs from one_objects data, splitting them by type
        nodes_ips    = [host["name"] for host in one_objects.get("hosts", [])]
        networks_ids = [net["id"] for net in one_objects.get("networks", [])]

        datastores   = one_objects.get("datastores", [])
        system_ds_id = next(
            (
                ds["id"]
                for ds in datastores
                if ds.get("template", {}).get("type") == "SYSTEM_DS"
            ),
            None
        )

        image_ds_id = next(
            (
                ds["id"]
                for ds in datastores
                if ds.get("template", {}).get("type") == "IMAGE_DS"
            ),
            None
        )

        # Clean up vars
        vars.pop("one_objects", None)
        vars.pop("tfstate", None)

        # Replace user_inputs_values with user_inputs
        vars["user_inputs"] = vars.pop("user_inputs_values", {})

        # Construct one_vars dictionary
        vars["one"] = {
            "version": one_version,
            "frontend_ip": frontend_ip,
            "nodes": nodes_ips,
            "network_ids": networks_ids,
            "system_ds_id": system_ds_id,
            "image_ds_id": image_ds_id,
        }

        self.logger.debug(f'Vars generated to use in the Jinja2 template: {vars}')

        return vars

    def _update_templates(self, inventory: dict, one_objects: dict) -> dict:
        """"Replace inventory vars templates and names with the ones from OneForm"""
        # Returns the base name of a resource (without the tagged suffix)
        def get_base_name(name: str) -> str: return re.sub(r'\s*\(.*\)', '', name)

        # Format the template to uppercase and remove 'name' and 'id' keys
        def format_template(tmplt: dict) -> dict:
            return {
                key.upper(): value
                for key, value in tmplt.items()
                if key not in ['name', 'id']
            }

        self.logger.debug('Updating inventory templates with OneForm data')

        inventory_vars = inventory.get('all').get('vars')

        for network in one_objects['networks']:
            vn_name = network['name']
            base_vn_name = get_base_name(vn_name)

            # Ignore ARs since they are managed by OpenNebula
            network['template'].pop('ar', None)

            if vn_name == base_vn_name:
                self.logger.debug(f'Network {vn_name} is not tagged, skipping')
                continue

            self.logger.debug(f'Updating network {base_vn_name} with {vn_name} information')
            vns = inventory_vars['vn']

            if base_vn_name not in vns:
                raise ValueError(f"Network {base_vn_name} not found in inventory")

            vns[vn_name]             = vns[base_vn_name]
            vns[vn_name]['template'] = format_template(network['template'])

            if base_vn_name in vns: del vns[base_vn_name]

        for datastore in one_objects['datastores']:
            ds_name = datastore['name']
            ds_type = datastore['template']['type']
            base_ds_name = get_base_name(ds_name)

            if ds_name == base_ds_name:
                self.logger.debug(f'Datastore {ds_name} is not tagged, skipping')
                continue

            self.logger.debug(f'Updating datastore {base_ds_name} with {ds_name} information')
            ds_in_type = inventory_vars['ds']['config'][ds_type]

            if base_ds_name not in ds_in_type:
                raise ValueError(f"Datastore {base_ds_name} not found in inventory")

            ds_in_type[ds_name]             = ds_in_type[base_ds_name]
            ds_in_type[ds_name]['template'] = format_template(datastore['template'])

            if base_ds_name in ds_in_type: del ds_in_type[base_ds_name]

        logging.debug(f'Inventory content generated: {inventory_vars}')
        inventory['all']['vars'] = inventory_vars

        return inventory

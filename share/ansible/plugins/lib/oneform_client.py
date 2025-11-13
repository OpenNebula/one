# !/usr/bin/env python
import os
import json
import requests

from requests.auth import HTTPBasicAuth
from json.decoder import JSONDecodeError

class OneFormClient:

    def __init__(self, endpoint: str, auth: str) -> None:
        """Initialize the OneForm client"""
        self.endpoint = self._ensure_http(endpoint)
        self.username, self.password = auth.split(":", 1)

    def get_provision(self, provision_id: int) -> dict:
        """Get provision document from OpenNebula"""
        if provision_id is None:
            raise ValueError("Provision ID is required to get provision data")

        # TODO: use dynamic versioning instead of set v1 as a literal
        headers  = { "Content-type": "application/json" }
        url      = f'{self.endpoint}/api/v1/provisions/{provision_id}'

        if provision_id < 0:
            raise ValueError(f"Invalid provision ID {provision_id}")

        # Get provision data from OneForm server
        response = self._make_get_request(
            url, headers, HTTPBasicAuth(self.username, self.password)
        )

        return self._proccess_body(response)

    @classmethod
    def get_credentials(cls, auth_path: str) -> tuple:
        """Read the credentials to authenticate with OpenNebula from a file"""
        if not os.path.exists(auth_path) or auth_path is None:
            raise FileNotFoundError(
                f"File {auth_path} not found. Please review the path or " \
                "provide a different auth file path using 'user_auth' in the " \
                "oneform-server.conf file."
            )

        with open(auth_path, "r") as file:
            content = file.readline().strip()

        if ":" not in content:
            raise ValueError(
                f"Invalid one_auth format in {auth_path}. Please provide the " \
                "credentials in the format 'username:password'"
            )

        return content

    # --------------------------------------------------------------
    # Private methods
    # --------------------------------------------------------------

    def _make_get_request(
            self,
            url: str,
            headers: dict,
            auth: HTTPBasicAuth
        ) -> requests.Response:
        """Make a GET request to the specified URL"""
        response = requests.get(url, headers=headers, auth=auth)

        if response.status_code != 200:
            raise requests.HTTPError(
                f'HTTPError getting data from {url}: {response.status_code} - {response.text}'
            )

        return response

    def _proccess_body(self, response: requests.Response) -> dict:
        """Process the provision body"""
        try:
            id   = response.json().get("DOCUMENT").get("ID")
            body = response.json().get("DOCUMENT").get('TEMPLATE').get('PROVISION_BODY')
        except Exception as e:
            raise JSONDecodeError(f'Error proccessing provision body from OneForm: {e}')

        if not body:
            raise ValueError("Provision body cannot be empty")

        # Add the provision ID to the body
        body["id"] = int(id)

        return body

    def _ensure_http(self, endpoint: str) -> str:
        """Ensure the endpoint URL starts with 'http://' or 'https://'"""
        return endpoint if endpoint.startswith("http") else f"http://{endpoint}"

# Copyright 2020 FELDSAM s.r.o. (www.feldhost.net)
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Abstract rules of the type USER RESOURCE RIGHTS
# which are:
#     USER      -> #<num>
#                  @<num>
#                  ALL
#     RESOURCE  -> + separated list and "/{#,@,%}<num>|ALL"
#                  VM
#                  HOST
#                  NET
#                  IMAGE
#                  USER
#                  TEMPLATE
#                  GROUP
#                  DATASTORE
#                  CLUSTER
#                  DOCUMENT
#                  ZONE
#                  SECGROUP
#                  VDC
#                  VROUTER
#                  MARKETPLACE
#                  MARKETPLACEAPP
#                  VMGROUP
#     RIGHTS    -> + separated list
#                  USE
#                  MANAGE
#                  ADMIN
#                  CREATE
import re

USERS = {
    "UID":     0x100000000,
    "GID":     0x200000000,
    "ALL":     0x400000000,
    "CLUSTER": 0x800000000
}

RESOURCES = {
    "VM" :            0x1000000000,
    "HOST":           0x2000000000,
    "NET":            0x4000000000,
    "IMAGE":          0x8000000000,
    "USER":           0x10000000000,
    "TEMPLATE":       0x20000000000,
    "GROUP":          0x40000000000,
    "DATASTORE":      0x100000000000,
    "CLUSTER":        0x200000000000,
    "DOCUMENT":       0x400000000000,
    "ZONE":           0x800000000000,
    "SECGROUP":       0x1000000000000,
    "VDC":            0x2000000000000,
    "VROUTER":        0x4000000000000,
    "MARKETPLACE":    0x8000000000000,
    "MARKETPLACEAPP": 0x10000000000000,
    "VMGROUP":        0x20000000000000,
    "VNTEMPLATE":     0x40000000000000
}

RIGHTS = {
    "USE":    0x1,  # Auth. to use an object
    "MANAGE": 0x2,  # Auth. to perform management actions
    "ADMIN":  0x4,  # Auth. to perform administrative actions
    "CREATE": 0x8   # Auth. to create an object
}


class OneAcl():
    # Converts a string in the form [#<id>, @<id>, *] to a hex. number
    #
    # @param users [String] Users component string
    #
    # @return [String] A string containing a hex number
    def parse_users(self, users):
       return hex(self.calculate_ids(users))

    # Converts a resources string to a hex. number
    #
    # @param resources [String] Resources component string
    #
    # @return [String] A string containing a hex number
    def parse_resources(self, resources):
        ret = 0
        resources = resources.split("/")

        if len(resources) != 2:
            raise Exception("Resource '{}' malformed".format("/".join(resources)))

        res = resources[0].split("+")
        for resource in res:
            if not resource.upper() in RESOURCES:
                raise Exception("Resource '{}' does not exist".format(resource))

            ret += RESOURCES[resource.upper()]

        ret += self.calculate_ids(resources[1])

        return hex(ret)

    # Converts a rights string to a hex. number
    #
    # @param rights [String] Rights component string
    #
    # @return [String] A string containing a hex number
    def parse_rights(self, rights):
        ret = 0
        rights = rights.split("+")

        for right in rights:
            if not right.upper() in RIGHTS:
                raise Exception("Right '{}' does not exist".format(right))

            ret += RIGHTS[right.upper()]

        return hex(ret)

    # Converts a string in the form [#<id>, *] to a hex. number
    #
    # @param zone [String] Zone component string
    #
    # @return [String] A string containing a hex number
    def parse_zone(self, zone):
        return hex(self.calculate_ids(zone))

    # Parses a rule string, e.g. "#5 HOST+VM/@12 INFO+CREATE+DELETE #0"
    #
    # @param rule_str [String] an ACL rule in string format
    #
    # @return Tuple an Tuple containing 3(4) strings (hex 64b numbers)
    def parse_rule(self, rule_str):
        ret = []

        rule_str = rule_str.split(" ")

        if len(rule_str) != 3 and len(rule_str) != 4:
            raise Exception("String needs three or four components: User, Resource, Rights [,Zone]")

        ret.append(self.parse_users(rule_str[0]))
        ret.append(self.parse_resources(rule_str[1]))
        ret.append(self.parse_rights(rule_str[2]))

        if len(rule_str) == 3:
            return ret[0], ret[1], ret[2]

        ret.append(self.parse_zone(rule_str[3]))

        return ret[0], ret[1], ret[2], ret[3]

    # Calculates the numeric value for a String containing an individual
    # (#<id>), group (@<id>) or all (*) ID component
    #
    # @param id_str [String] Rule Id string
    #
    # @return [Integer] the numeric value for the given id_str
    def calculate_ids(self, id_str):
        if not re.match('^([\#@\%]\d+|\*)$', id_str):
            raise Exception("ID string '{}' malformed".format(id_str))

        users_value = 0

        if id_str[0] == "#":
            value = USERS["UID"]
            users_value = int(id_str[1:]) + value

        if id_str[0] == "@":
            value = USERS["GID"]
            users_value = int(id_str[1:]) + value

        if id_str[0] == "*":
            users_value = USERS["ALL"]

        if id_str[0] == "%":
            value = USERS["CLUSTER"]
            users_value = int(id_str[1:]) + value

        return users_value

#!/usr/bin/python

# -------------------------------------------------------------------------- #
# Copyright 2016-2018                                                        #
#                                                                            #
# Portions copyright OpenNebula Project (OpenNebula.org), CG12 Labs          #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
# -------------------------------------------------------------------------- #


def print_data(data):
    monitor = 'STATE=%s' % (data['STATE'])

    if data['STATE'] == 'a':
        monitor += ' CPU=%s MEMORY=%s NETRX=%s NETTX=%s' % (
            data['USEDCPU'], data['USEDMEMORY'], data['NETRX'], data['NETTX'])

    return monitor


def print_all_vm_template(hypervisor):
    instance = hypervisor()
    try:
        vms = instance.get_all_vm_info()

        print 'VM_POLL=YES'

        for info in vms.values():
            id_number = -1

            if 'one-' in info['NAME']:
                id_number = info['NAME'].split('-')[1]

            string = "VM=[\n"
            string += "  ID=%s,\n  DEPLOY_ID=%s,\n" % (id_number, info['NAME'])

            # Wild VMs
            # try:
            #     string += "  VM_NAME=%s,\n  IMPORT_TEMPLATE=%s\n" % (info['VM_NAME'], info['TEMPLATE'])
            # except:
            #     pass

            monitor = print_data(info)

            string += '  POLL="%s" ]' % (monitor)

            print string

    except:
        return None


def print_one_vm_info(hypervisor, vm_id):
    instance = hypervisor()
    try:
        info = instance.get_vm_info(vm_id)
        print print_data(info)
        # vnc_babysiter(info)
    except:
        return None


# def print_all_vm_info(hypervisor):
#     instance = hypervisor()
#     try:
#         vms = instance.get_all_vm_info()
#     except:
#         return None
#     pass

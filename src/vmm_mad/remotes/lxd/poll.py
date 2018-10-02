#!/usr/bin/env python

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

import sys
import poll_common as pc
import lxd_common as lc
import time
# import base64
# import uuid

client = lc.Client()


class LXD(object):
    """docstring for LXD"""

    vmd = {}

    def __init__(self):
        super(LXD, self).__init__()

    def get_all_containers(self):
        containers = client.containers.all()
        return containers

    def get_vm_info(self, one_vm):
        containers = self.get_all_containers()
        for vm in containers:
            if vm.name == one_vm:
                try:
                    values = self.get_values(vm)
                    # Wild VMs
                    # if 'one-' not in vm.name:
                    #     uuid, template = self.config_to_one(vm)
                    #     values["TEMPLATE"] = base64.b64encode(template).replace(' ', '')
                    #     values["VM_NAME"] = uuid
                except Exception:
                    values = {"STATE": '-'}

        return values

    def get_all_vm_info(self):
        vmsd_info = {}

        containers = self.get_all_containers()

        if len(containers) == 0:
            return vmsd_info

        for vm in containers:
            values = self.get_values(vm)
            vmsd_info[vm.name] = values

        return vmsd_info

    def dom_info(self, vm):
        dictpos = {}
        self.vmd = {}

        cmd = 'lxc info %s' % vm
        lxcInfo = lc.sp.Popen(cmd, stdout=lc.sp.PIPE, shell=True).communicate()[0]

        for line in lxcInfo.split("\n"):
            line = line.lower().split("\n")[0]
            linesplit = line.split(":")

            blank_spaces = len(line) - len(line.lstrip(' '))
            blank_spaces_parent = -1
            pathparent = ""
            for x, y in dictpos.iteritems():
                if x < blank_spaces and x > blank_spaces_parent:
                    blank_spaces_parent = x
                    pathparent = y
            path = pathparent + "/" + linesplit[0].lstrip(' ')
            try:
                if linesplit[1]:
                    valor = ""
                    for parte in linesplit[1:]:
                        valor += parte.lstrip(' ')
                    try:
                        self.vmd[path].append(valor)
                    except Exception:
                        self.vmd[path] = [valor]
                else:
                    dictpos[blank_spaces] = path

            except Exception:
                dictpos[blank_spaces] = path

    def get_values(self, vm):
        values = {
            "NAME": vm.name,
            "STATE": self.get_state_info(vm)
        }
        if values["STATE"] == "a":
            self.dom_info(values["NAME"])
            # values["USEDMEMORY"] = self.vmd["/resources/memory usage/memory (current)"][0]
            values["USEDMEMORY"] = self.get_memory_info()
            values["USEDCPU"] = self.get_cpu_info()
            values["NETRX"], values["NETTX"] = self.get_net_statistics()

        return values

    # Wild VMs
    # def config_to_one(self, vm):
    #     configd = vm.config
    #     try:
    #         UUID = configd['user.uuid']
    #     except:
    #         vm.config['user.uuid'] = str(uuid.uuid4())
    #         vm.save()

    #     configd = vm.config
    #     arch = self.vmd["/architecture"][0]
    #     UUID = configd['user.uuid']
    #     name = vm.name

    #     try:
    #         memory = configd['limits.memory']
    #         vcpu = configd['limits.cpu']
    #         template = 'VM_NAME="%s"\nCPU="%s"\nVCPU="%s"\nMEMORY="%s"\nHYPERVISOR="lxd"\nIMPORT_VM_ID="%s"\nOS=[ARCH="%s"]' % (
    #             name, vcpu, vcpu, memory, UUID, arch)
    #     except:
    #         template = 'VM_NAME="%s"\nHYPERVISOR="lxd"\nIMPORT_VM_ID="%s"\nOS=[ARCH="%s"]' % (
    #             name, UUID, arch)

    #     return UUID, template

    def get_state_info(self, vm):
        try:
            status = vm.status.lower()
        except Exception:
            status = "unknown"

        case = {
            "running": "a",
            "frozen": "p",
            "stopped": "d",
            "failure": "e"
        }

        try:
            return case[status]
        except Exception:
            return "e"

    def get_net_statistics(self):
        netrx = 0
        nettx = 0
        for key, value in self.vmd.iteritems():
            if key.__contains__("/resources/network usage/") and not(key.__contains__("/resources/network usage/lo")):
                value = self.get_net_in_bytes(value)
                if key.__contains__("bytes received"):
                    netrx += int(value)
                elif key.__contains__("bytes sent"):
                    nettx += int(value)

        return netrx, nettx

    def get_net_in_bytes(self, value):
        exponent = 0
        if 'kb' in value[0]:
            unit = 'kb'
            exponent = 1
        elif 'mb' in value[0]:
            unit = 'mb'
            exponent = 2
        elif 'gb' in value[0]:
            unit = 'gb'
            exponent = 3
        elif 'tb' in value[0]:
            unit = 'tb'
            exponent = 4
        elif 'bytes' in value[0]:
            unit = ' '
        else:
            unit = "b"

        value = float(value[0].split(unit)[0]) * 1024 ** exponent

        return value

    def get_memory_info(self):
        name = self.vmd["/name"][0]

        stat = int(file("/sys/fs/cgroup/memory/lxc/" + name + "/memory.usage_in_bytes").readline())
        stat /= 1024

        return stat

    def get_cpu_info(self):
        name = self.vmd["/name"][0]

        multiplier = int(lc.sp.Popen('nproc', stdout=lc.sp.PIPE, shell=True).communicate()[0]) * 100

        start_cpu_jiffies = self.get_cpu_jiffies()
        using_cpu = float(self.get_process_jiffies(name))

        time.sleep(1)

        delta_cpu_jiffies = self.get_cpu_jiffies() - start_cpu_jiffies
        delta_using_cpu = float(self.get_process_jiffies(name)) - using_cpu

        using_cpu = delta_using_cpu / delta_cpu_jiffies
        using_cpu = round(using_cpu * multiplier, 2)

        return using_cpu

    def get_cpu_jiffies(self):
        try:
            stat = file("/proc/stat", 'r').readline()
        except Exception:
            return 0

        jiffies = 0

        for num in stat.split(" ")[1:-3]:
            if num:
                jiffies += int(num)

        return jiffies

    def get_process_jiffies(self, name):
        jiffies = 0
        try:
            stat = file("/sys/fs/cgroup/cpu,cpuacct/lxc/" + name + "/cpuacct.stat").readlines()
            for line in stat:
                jiffies += int(line.split(" ")[1])
        except Exception:
            return 0

        return jiffies


hypervisor = LXD

try:
    vm_id = sys.argv[1]

    if vm_id == '-t':
        pc.print_all_vm_template(hypervisor)
    elif vm_id:
        pc.print_one_vm_info(hypervisor, vm_id)

except Exception:
    # pc.print_all_vm_info(hypervisor)
    pass

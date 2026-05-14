#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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
#--------------------------------------------------------------------------- #

def unindent(s)
    m = s.match(/^(\s*)/)
    spaces = m[1].size
    s.gsub!(/^ {#{spaces}}/, '')
end

def topology(nodes, cores, pages, threads, mem)
    result = ''

    nodes.times do |i|
        cores.times do |j|
            core_id  = j + (i * cores)

            core_str = "CORE = [ NODE_ID=\"#{i}\", ID=\"#{core_id}\", CPUS=\""

            threads.times do |k|
                cpu_id = core_id + k * (cores * nodes)

                core_str << ',' if k != 0
                core_str << cpu_id.to_s
            end

            core_str << "\"]\n"

            result << core_str
        end

        pages.each do |p|
            result << "HUGEPAGE = [ SIZE = \"#{p}\", "\
                "PAGES = \"1024\", NODE_ID = \"#{i}\" ]\n"
        end

        memn = mem.to_i/nodes

        result << "MEMORY_NODE = [ NODE_ID = \"#{i}\", TOTAL = \"#{memn}\"" \
            ", DISTANCE = \"#{i} "

        nodes.times do |l|
            result << "#{l} " if l != i
        end

        result << "\" ]\n"
    end

    result
end

def pci
    unindent(<<-EOS)
       PCI = [ ADDRESS = "0000:02:00:0",
               BUS = "02",
               CLASS = "0302",
               CLASS_NAME = "3D controller",
               DEVICE = "0863",
               DEVICE_NAME = "C79 [GeForce 9400M]",
               DOMAIN = "0000",
               FUNCTION = "0",
               IFNAME ="-",
               NUMA_NODE ="1",
               SRIOV ="no",
               PROFILES = "1145 (NVIDIA L40S-1B),1146 (NVIDIA L40S-2B),1147 (NVIDIA L40S-1Q),1148 (NVIDIA L40S-2Q),1149 (NVIDIA L40S-3Q),1150 (NVIDIA L40S-4Q),1151 (NVIDIA L40S-6Q),1152 (NVIDIA L40S-8Q),1153 (NVIDIA L40S-12Q),1154 (NVIDIA L40S-16Q),1155 (NVIDIA L40S-24Q),1156 (NVIDIA L40S-48Q),1157 (NVIDIA L40S-1A),1158 (NVIDIA L40S-2A),1159 (NVIDIA L40S-3A),1160 (NVIDIA L40S-4A),1161 (NVIDIA L40S-6A),1162 (NVIDIA L40S-8A),1163 (NVIDIA L40S-12A),1164 (NVIDIA L40S-16A),1165 (NVIDIA L40S-24A),1166 (NVIDIA L40S-48A)",
               SHORT_ADDRESS = "02:00.0",
               SLOT = "00",
               TYPE = "10de:0863:0302",
               VENDOR = "10de",
               VENDOR_NAME = "NVIDIA Corporation"
       ]

       PCI = [ ADDRESS = "0000:00:06:0",
               BUS = "00",
               CLASS = "0c03",
               CLASS_NAME = "USB controller",
               DEVICE = "0aa7",
               DEVICE_NAME = "MCP79 OHCI USB 1.1 Controller",
               DOMAIN = "0000",
               FUNCTION = "0",
               IFNAME ="-",
               NUMA_NODE ="1",
               SRIOV ="no",
               SHORT_ADDRESS = "00:06.0",
               SLOT = "06",
               TYPE = "1b21:0aa7:0c03",
               VENDOR = "1b21",
               VENDOR_NAME = "ASMedia Technology Inc."
       ]

       PCI = [ ADDRESS = "0000:00:06:1",
               BUS = "00",
               CLASS = "0c03",
               CLASS_NAME = "USB controller",
               DEVICE = "0aa9",
               DEVICE_NAME = "MCP79 EHCI USB 2.0 Controller",
               DOMAIN = "0000",
               FUNCTION = "1",
               IFNAME ="-",
               NUMA_NODE ="0",
               SRIOV ="no",
               SHORT_ADDRESS = "00:06.1",
               SLOT = "06",
               TYPE = "1022:0aa9:0c03",
               VENDOR = "1022",
               VENDOR_NAME = "Advanced Micro Devices, Inc."
       ]

       PCI = [
               TYPE = "14e4:165f:0200",
               VENDOR = "14e4",
               VENDOR_NAME = "Broadcom Inc. and subsidiaries",
               DEVICE = "165f",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:04:00:1",
               SHORT_ADDRESS = "04:00.1",
               DOMAIN = "0000",
               BUS = "04",
               SLOT = "00",
               FUNCTION = "1",
               NUMA_NODE = "0",
               DEVICE_NAME = "NetXtreme BCM5720 Gigabit Ethernet PCIe",
               SRIOV="no",
               IFNAME = "eno8403"
       ]

       PCI = [
               TYPE = "15b3:1015:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1015",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:0",
               SHORT_ADDRESS = "81:00.0",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "0",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx]",
               SRIOV="pf",
               SRIOV_NUM="8",
               IFNAME = "pf0",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1015:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1015",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:1",
               SHORT_ADDRESS = "81:00.1",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "1",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx]",
               SRIOV="pf",
               SRIOV_NUM="8",
               IFNAME = "pf1",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:2",
               SHORT_ADDRESS = "81:00.2",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "2",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf002",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:3",
               SHORT_ADDRESS = "81:00.3",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "3",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf003",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:4",
               SHORT_ADDRESS = "81:00.4",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "4",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf004",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:5",
               SHORT_ADDRESS = "81:00.5",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "5",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf005",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:6",
               SHORT_ADDRESS = "81:00.6",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "6",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf006",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:00:7",
               SHORT_ADDRESS = "81:00.7",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "00",
               FUNCTION = "7",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf007",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:0",
               SHORT_ADDRESS = "81:01.0",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "0",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf010",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:1",
               SHORT_ADDRESS = "81:01.1",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "1",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf011",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:2",
               SHORT_ADDRESS = "81:01.2",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "2",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf012",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:3",
               SHORT_ADDRESS = "81:01.3",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "3",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf013",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:4",
               SHORT_ADDRESS = "81:01.4",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "4",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf014",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:5",
               SHORT_ADDRESS = "81:01.5",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "5",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf015",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:6",
               SHORT_ADDRESS = "81:01.6",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "6",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf016",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:01:7",
               SHORT_ADDRESS = "81:01.7",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "01",
               FUNCTION = "7",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf017",
               VMID = "-1"
       ]
       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:02:0",
               SHORT_ADDRESS = "81:02.0",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "02",
               FUNCTION = "0",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf020",
               VMID = "-1"
       ]

       PCI = [
               TYPE = "15b3:1016:0200",
               VENDOR = "15b3",
               VENDOR_NAME = "Mellanox Technologies",
               DEVICE = "1016",
               CLASS = "0200",
               CLASS_NAME = "Ethernet controller",
               ADDRESS = "0000:81:02:1",
               SHORT_ADDRESS = "81:02.1",
               DOMAIN = "0000",
               BUS = "81",
               SLOT = "02",
               FUNCTION = "1",
               NUMA_NODE = "0",
               DEVICE_NAME = "MT27710 Family [ConnectX-4 Lx Virtual Function]",
               SRIOV="vf",
               IFNAME = "vf021",
               VMID = "-1"
       ]

    EOS
end

def system
    unindent(<<-EOS)
        ARCH=x86_64
        HYPERVISOR=dummy
        MODELNAME="Dummy(R) Core @ 3.2GHz"
        CPUSPEED=3200
        TOTALMEMORY=16777216
        TOTALCPU=800
        DS_LOCATION_USED_MB=9720
        DS_LOCATION_TOTAL_MB=20480
        DS_LOCATION_FREE_MB=20480
        KVM_CPU_MODELS="486 pentium pentium2 pentium3 pentiumpro coreduo n270 core2duo qemu32 kvm32 cpu64-rhel5 cpu64-rhel6 kvm64 Conroe Penryn Nehalem Nehalem-IBRS Westmere Westmere-IBRS SandyBridge SandyBridge-IBRS IvyBridge IvyBridge-IBRS SapphireRapids SapphireRapids-noTSX Opteron_G1"
        KVM_CPU_FEATURES="vme,ds,acpi,ss,ht,tm,pbe,dtes64,monitor,ds_cpl,vmx,smx,est,tm2,xtpr,pdcm,osxsave,f16c,rdrand,arat,tsc_adjust,clflushopt,clwb,intel-pt,sha-ni,umip,pku,ospke,waitpkg,gfni,vaes,vpclmulqdq,rdpid,movdiri,movdir64b,pks,fsrm,md-clear,serialize,arch-lbr,stibp,arch-capabilities,core-capability,ssbd,avx-vnni,xsaveopt,xsavec,xgetbv1,xsaves,pdpe1gb,abm,invtsc,rdctl-no,ibrs-all,skip-l1dfl-vmentry,mds-no,pschange-mc-no"
    EOS
end

def hostname
    "HOSTNAME=#{ARGV[2]}\n"
end

def memory_encryption
    "MEMORY_ENCRYPTION=\"SEV\"\n"
end

result = ''

result << system
result << memory_encryption
result << hostname
result << topology(2, 8, [2048, 1048576], 4, 16777216)
result << pci

puts result

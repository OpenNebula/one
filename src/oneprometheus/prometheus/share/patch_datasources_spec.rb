# frozen_string_literal: true

require 'rspec'
require 'socket'
require 'uri'
require 'yaml'

require_relative 'patch_datasources'

RSpec.describe 'list_to_dict / dict_to_list' do
    it 'should convert list to dict' do
        provided = [ { 'key' => 'a', 'field' => 1 },
                     { 'key' => 'b', 'field' => 2 } ]

        expected = { 'a' => { 'key' => 'a', 'field' => 1 },
                     'b' => { 'key' => 'b', 'field' => 2 } }

        expect(list_to_dict(provided, key: 'key')).to eq expected
    end
    it 'should convert dict to list' do
        provided = { 'a' => { 'key' => 'a', 'field' => 1 },
                     'b' => { 'key' => 'b', 'field' => 2 } }

        expected = [ { 'key' => 'a', 'field' => 1 },
                     { 'key' => 'b', 'field' => 2 } ]

        expect(dict_to_list(provided)).to eq expected
    end
end

RSpec.describe 'detect_servers' do
    it 'should detect 0 peers' do
        allow(self).to receive(:onezone_show).and_return YAML.safe_load(<<~DOCUMENT)
        ---
        ZONE:
          ID: '0'
          NAME: OpenNebula
          STATE: '0'
          TEMPLATE:
            ENDPOINT: http://localhost:2633/RPC2
          SERVER_POOL: {}
        DOCUMENT

        allow(Socket).to receive(:ip_address_list).and_return [
            Addrinfo.ip('127.0.0.1'),
            Addrinfo.ip('192.168.150.1')
        ]

        expect(detect_servers).to eq [
            [], Socket.gethostname
        ]
    end
    it 'should detect 2 peers' do
        allow(self).to receive(:onezone_show).and_return YAML.safe_load(<<~DOCUMENT)
        ---
        ZONE:
          ID: '0'
          NAME: OpenNebula
          STATE: '0'
          TEMPLATE:
            ENDPOINT: http://localhost:2633/RPC2
          SERVER_POOL:
            SERVER:
            - ENDPOINT: http://192.168.150.1:2633/RPC2
              ID: '0'
              NAME: Node-1
              STATE: '2'
              TERM: '22'
              VOTEDFOR: '1'
              COMMIT: '97912'
              LOG_INDEX: '97912'
              FEDLOG_INDEX: "-1"
            - ENDPOINT: http://192.168.150.2:2633/RPC2
              ID: '1'
              NAME: Node-2
              STATE: '3'
              TERM: '22'
              VOTEDFOR: '1'
              COMMIT: '97912'
              LOG_INDEX: '97912'
              FEDLOG_INDEX: "-1"
            - ENDPOINT: http://192.168.150.3:2633/RPC2
              ID: '2'
              NAME: Node-3
              STATE: '2'
              TERM: '22'
              VOTEDFOR: "-1"
              COMMIT: '97912'
              LOG_INDEX: '97912'
              FEDLOG_INDEX: "-1"
        DOCUMENT

        allow(Socket).to receive(:ip_address_list).and_return [
            Addrinfo.ip('127.0.0.1'),
            Addrinfo.ip('192.168.150.2')
        ]

        expect(detect_servers).to eq [
            ['192.168.150.1', '192.168.150.3'], '192.168.150.2'
        ]
    end
end

RSpec.describe 'patch_datasources' do
    before(:all) do
        @onehost_list = YAML.safe_load(<<~DOCUMENT)
        ---
          - ID: '1'
            NAME: omicron
            STATE: '2'
            PREV_STATE: '2'
            IM_MAD: kvm
            VM_MAD: kvm
            CLUSTER_ID: '0'
            CLUSTER: default
            HOST_SHARE:
              MEM_USAGE: '0'
              CPU_USAGE: '0'
              TOTAL_MEM: '65219716'
              TOTAL_CPU: '1200'
              MAX_MEM: '65219716'
              MAX_CPU: '1200'
              RUNNING_VMS: '0'
              VMS_THREAD: '1'
              DATASTORES:
                DISK_USAGE: '0'
                FREE_DISK: '501528'
                MAX_DISK: '781195'
                USED_DISK: '279668'
              PCI_DEVICES: {}
              NUMA_NODES:
                NODE:
                  CORE:
                  - CPUS: 10:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '5'
                  - CPUS: 8:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '4'
                  - CPUS: 6:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '3'
                  - CPUS: 4:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '2'
                  - CPUS: 2:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '1'
                  - CPUS: 0:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '0'
                  HUGEPAGE:
                  - FREE: '0'
                    PAGES: '0'
                    SIZE: '2048'
                    USAGE: '0'
                  - FREE: '0'
                    PAGES: '0'
                    SIZE: '1048576'
                    USAGE: '0'
                  MEMORY:
                    DISTANCE: '0'
                    FREE: '0'
                    TOTAL: '65219716'
                    USAGE: '0'
                    USED: '0'
                  NODE_ID: '0'
            VMS: {}
            TEMPLATE:
              ARCH: x86_64
              CGROUPS_VERSION: '1'
              CPUSPEED: '3349'
              HOSTNAME: omicron
              HYPERVISOR: kvm
              IM_MAD: kvm
              KVM_CPU_MODEL: EPYC-Rome
              KVM_CPU_MODELS: 486 pentium pentium2 pentium3 pentiumpro coreduo n270 core2duo
                qemu32 kvm32 cpu64-rhel5 cpu64-rhel6 qemu64 kvm64 Conroe Penryn Nehalem Nehalem-IBRS
                Westmere Westmere-IBRS SandyBridge SandyBridge-IBRS IvyBridge IvyBridge-IBRS
                Haswell-noTSX Haswell-noTSX-IBRS Haswell Haswell-IBRS Broadwell-noTSX Broadwell-noTSX-IBRS
                Broadwell Broadwell-IBRS Skylake-Client Skylake-Client-IBRS Skylake-Client-noTSX-IBRS
                Skylake-Server Skylake-Server-IBRS Skylake-Server-noTSX-IBRS Cascadelake-Server
                Cascadelake-Server-noTSX Icelake-Client Icelake-Client-noTSX Icelake-Server
                Icelake-Server-noTSX athlon phenom Opteron_G1 Opteron_G2 Opteron_G3 Opteron_G4
                Opteron_G5 EPYC EPYC-IBPB EPYC-Rome EPYC-Milan Dhyana
              KVM_MACHINES: pc-i440fx-focal ubuntu pc-0.15 pc-i440fx-2.12 pc-i440fx-2.0 pc-i440fx-xenial
                pc-q35-4.2 q35 pc-i440fx-2.5 pc-i440fx-4.2 pc pc-q35-xenial pc-i440fx-1.5
                pc-0.12 pc-q35-2.7 pc-q35-eoan-hpb pc-i440fx-disco-hpb pc-i440fx-zesty pc-q35-artful
                pc-i440fx-trusty pc-i440fx-2.2 pc-i440fx-eoan-hpb pc-q35-focal-hpb pc-1.1
                pc-q35-bionic-hpb pc-i440fx-artful pc-i440fx-2.7 pc-i440fx-yakkety pc-q35-2.4
                pc-q35-cosmic-hpb pc-q35-2.10 pc-i440fx-1.7 pc-0.14 pc-q35-2.9 pc-i440fx-2.11
                pc-q35-3.1 pc-q35-4.1 pc-i440fx-2.4 pc-1.3 pc-i440fx-4.1 pc-q35-eoan pc-i440fx-2.9
                pc-i440fx-bionic-hpb isapc pc-i440fx-1.4 pc-q35-cosmic pc-q35-2.6 pc-i440fx-3.1
                pc-q35-bionic pc-q35-disco-hpb pc-i440fx-cosmic pc-q35-2.12 pc-i440fx-bionic
                pc-q35-disco pc-i440fx-cosmic-hpb pc-i440fx-2.1 pc-1.0 pc-i440fx-wily pc-i440fx-2.6
                pc-q35-4.0.1 pc-i440fx-1.6 pc-0.13 pc-q35-2.8 pc-i440fx-2.10 pc-q35-3.0 pc-q35-zesty
                pc-q35-4.0 microvm pc-i440fx-2.3 pc-q35-focal ubuntu-q35 pc-i440fx-disco pc-1.2
                pc-i440fx-4.0 pc-i440fx-focal-hpb pc-i440fx-2.8 pc-i440fx-eoan pc-q35-2.5
                pc-i440fx-3.0 pc-q35-yakkety pc-q35-2.11
              MODELNAME: AMD Ryzen 5 PRO 5650U with Radeon Graphics
              RESERVED_CPU: ''
              RESERVED_MEM: ''
              VERSION: 6.4.1
              VM_MAD: kvm
            MONITORING: {}
          - ID: '0'
            NAME: epsilon
            STATE: '2'
            PREV_STATE: '2'
            IM_MAD: kvm
            VM_MAD: kvm
            CLUSTER_ID: '0'
            CLUSTER: default
            HOST_SHARE:
              MEM_USAGE: '0'
              CPU_USAGE: '0'
              TOTAL_MEM: '65219716'
              TOTAL_CPU: '1200'
              MAX_MEM: '65219716'
              MAX_CPU: '1200'
              RUNNING_VMS: '0'
              VMS_THREAD: '1'
              DATASTORES:
                DISK_USAGE: '0'
                FREE_DISK: '501528'
                MAX_DISK: '781195'
                USED_DISK: '279668'
              PCI_DEVICES: {}
              NUMA_NODES:
                NODE:
                  CORE:
                  - CPUS: 10:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '5'
                  - CPUS: 8:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '4'
                  - CPUS: 6:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '3'
                  - CPUS: 4:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '2'
                  - CPUS: 2:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '1'
                  - CPUS: 0:-1
                    DEDICATED: 'NO'
                    FREE: '1'
                    ID: '0'
                  HUGEPAGE:
                  - FREE: '0'
                    PAGES: '0'
                    SIZE: '2048'
                    USAGE: '0'
                  - FREE: '0'
                    PAGES: '0'
                    SIZE: '1048576'
                    USAGE: '0'
                  MEMORY:
                    DISTANCE: '0'
                    FREE: '0'
                    TOTAL: '65219716'
                    USAGE: '0'
                    USED: '0'
                  NODE_ID: '0'
            VMS: {}
            TEMPLATE:
              ARCH: x86_64
              CGROUPS_VERSION: '1'
              CPUSPEED: '2715'
              HOSTNAME: epsilon
              HYPERVISOR: kvm
              IM_MAD: kvm
              KVM_CPU_MODEL: EPYC-Rome
              KVM_CPU_MODELS: 486 pentium pentium2 pentium3 pentiumpro coreduo n270 core2duo
                qemu32 kvm32 cpu64-rhel5 cpu64-rhel6 qemu64 kvm64 Conroe Penryn Nehalem Nehalem-IBRS
                Westmere Westmere-IBRS SandyBridge SandyBridge-IBRS IvyBridge IvyBridge-IBRS
                Haswell-noTSX Haswell-noTSX-IBRS Haswell Haswell-IBRS Broadwell-noTSX Broadwell-noTSX-IBRS
                Broadwell Broadwell-IBRS Skylake-Client Skylake-Client-IBRS Skylake-Client-noTSX-IBRS
                Skylake-Server Skylake-Server-IBRS Skylake-Server-noTSX-IBRS Cascadelake-Server
                Cascadelake-Server-noTSX Icelake-Client Icelake-Client-noTSX Icelake-Server
                Icelake-Server-noTSX athlon phenom Opteron_G1 Opteron_G2 Opteron_G3 Opteron_G4
                Opteron_G5 EPYC EPYC-IBPB EPYC-Rome EPYC-Milan Dhyana
              KVM_MACHINES: pc-i440fx-focal ubuntu pc-0.15 pc-i440fx-2.12 pc-i440fx-2.0 pc-i440fx-xenial
                pc-q35-4.2 q35 pc-i440fx-2.5 pc-i440fx-4.2 pc pc-q35-xenial pc-i440fx-1.5
                pc-0.12 pc-q35-2.7 pc-q35-eoan-hpb pc-i440fx-disco-hpb pc-i440fx-zesty pc-q35-artful
                pc-i440fx-trusty pc-i440fx-2.2 pc-i440fx-eoan-hpb pc-q35-focal-hpb pc-1.1
                pc-q35-bionic-hpb pc-i440fx-artful pc-i440fx-2.7 pc-i440fx-yakkety pc-q35-2.4
                pc-q35-cosmic-hpb pc-q35-2.10 pc-i440fx-1.7 pc-0.14 pc-q35-2.9 pc-i440fx-2.11
                pc-q35-3.1 pc-q35-4.1 pc-i440fx-2.4 pc-1.3 pc-i440fx-4.1 pc-q35-eoan pc-i440fx-2.9
                pc-i440fx-bionic-hpb isapc pc-i440fx-1.4 pc-q35-cosmic pc-q35-2.6 pc-i440fx-3.1
                pc-q35-bionic pc-q35-disco-hpb pc-i440fx-cosmic pc-q35-2.12 pc-i440fx-bionic
                pc-q35-disco pc-i440fx-cosmic-hpb pc-i440fx-2.1 pc-1.0 pc-i440fx-wily pc-i440fx-2.6
                pc-q35-4.0.1 pc-i440fx-1.6 pc-0.13 pc-q35-2.8 pc-i440fx-2.10 pc-q35-3.0 pc-q35-zesty
                pc-q35-4.0 microvm pc-i440fx-2.3 pc-q35-focal ubuntu-q35 pc-i440fx-disco pc-1.2
                pc-i440fx-4.0 pc-i440fx-focal-hpb pc-i440fx-2.8 pc-i440fx-eoan pc-q35-2.5
                pc-i440fx-3.0 pc-q35-yakkety pc-q35-2.11
              MODELNAME: AMD Ryzen 5 PRO 5650U with Radeon Graphics
              RESERVED_CPU: ''
              RESERVED_MEM: ''
              VERSION: 6.4.1
              VM_MAD: kvm
            MONITORING: {}
        DOCUMENT

        @provided = YAML.safe_load(<<~DOCUMENT)
        global:
          scrape_interval:     15s
          evaluation_interval: 15s
        alerting:
          alertmanagers:
          - static_configs:
            - targets: ['localhost:9093']
        rule_files: ['rules.yml']
        scrape_configs:
        - job_name: prometheus
          static_configs:
          - targets: ['localhost:9090']
        DOCUMENT
    end

    it 'should patch prometheus datasources for 1 peer' do
        allow(self).to receive(:onehost_list).and_return @onehost_list

        allow(self).to receive(:detect_servers).and_return [
            [], '127.0.0.1'
        ]

        expected = YAML.safe_load(<<~DOCUMENT)
        ---
        global:
          scrape_interval: 15s
          evaluation_interval: 15s
        alerting:
          alertmanagers:
          - static_configs:
            - targets:
              - 127.0.0.1:9093
        rule_files:
        - rules.yml
        scrape_configs:
        - job_name: prometheus
          static_configs:
          - targets:
            - localhost:9090
        - job_name: opennebula_exporter
          static_configs:
          - targets:
            - 127.0.0.1:9925
        - job_name: node_exporter
          static_configs:
          - targets:
            - omicron:9100
            labels:
              one_host_id: '1'
          - targets:
            - epsilon:9100
            labels:
              one_host_id: '0'
          - targets:
            - 127.0.0.1:9100
        - job_name: libvirt_exporter
          static_configs:
          - targets:
            - omicron:9926
            labels:
              one_host_id: '1'
          - targets:
            - epsilon:9926
            labels:
              one_host_id: '0'
        DOCUMENT

        expect(patch_datasources(@provided)).to eq expected
    end

    it 'should patch prometheus datasources for 3 peers' do
        allow(self).to receive(:onehost_list).and_return @onehost_list

        allow(self).to receive(:detect_servers).and_return [
            ['192.168.150.1', '192.168.150.3'], '192.168.150.2'
        ]

        expected = YAML.safe_load(<<~DOCUMENT)
        ---
        global:
          scrape_interval: 15s
          evaluation_interval: 15s
        alerting:
          alertmanagers:
          - static_configs:
            - targets:
              - 192.168.150.1:9093
              - 192.168.150.3:9093
              - 192.168.150.2:9093
        rule_files:
        - rules.yml
        scrape_configs:
        - job_name: prometheus
          static_configs:
          - targets:
            - localhost:9090
        - job_name: opennebula_exporter
          static_configs:
          - targets:
            - 192.168.150.2:9925
        - job_name: node_exporter
          static_configs:
          - targets:
            - 192.168.150.1:9100
            - 192.168.150.3:9100
          - targets:
            - omicron:9100
            labels:
              one_host_id: '1'
          - targets:
            - epsilon:9100
            labels:
              one_host_id: '0'
          - targets:
            - 192.168.150.2:9100
        - job_name: libvirt_exporter
          static_configs:
          - targets:
            - omicron:9926
            labels:
              one_host_id: '1'
          - targets:
            - epsilon:9926
            labels:
              one_host_id: '0'
        DOCUMENT

        expect(patch_datasources(@provided)).to eq expected
    end
end

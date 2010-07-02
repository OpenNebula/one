$: << '../'

require 'OpenNebula'
require 'MockClient'

module OpenNebula

    describe "VirtualMachinePool using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            client = MockClient.new()
            @vm_pool = VirtualMachinePool.new(client)
        end
        
        it "should update the VM_POOL info" do
            rc = @vm_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the VM_POOL elements and get info from them" do
            rc = @vm_pool.each{ |vm|
                vm.class.to_s.should eql("OpenNebula::VirtualMachine")
                if vm.id == 6
                    vm.name.should eql('vm-example')
                    vm.state.should eql(3)
                    vm.state_str.should eql('ACTIVE')
                elsif vm.id == 8
                    vm.name.should eql('vmext')
                    vm.state.should eql(4)
                    vm.state_str.should eql('STOPPED')
                end
            }
        end
        
        it "should get a hash representation of the VM_POOL" do
            vm_hash = @vm_pool.to_hash
            vm_hash['VM_POOL']['VM'][0]['ID'].should eql('6')
            vm_hash['VM_POOL']['VM'][0]['UID'].should eql('0')
            vm_hash['VM_POOL']['VM'][0]['USERNAME'].should eql('oneadmin')
            vm_hash['VM_POOL']['VM'][0]['NAME'].should eql('vm-example')
            vm_hash['VM_POOL']['VM'][0]['LAST_POLL'].should eql('1277910006')
            vm_hash['VM_POOL']['VM'][0]['HISTORY']['HOSTNAME'].should eql('dummyhost')
            vm_hash['VM_POOL']['VM'][0]['HISTORY']['STIME'].should eql('1277375186')
            vm_hash['VM_POOL']['VM'][0]['HISTORY']['REASON'].should eql('0')
            vm_hash['VM_POOL']['VM'][2]['ID'].should eql('8')
            vm_hash['VM_POOL']['VM'][2]['UID'].should eql('0')
            vm_hash['VM_POOL']['VM'][2]['USERNAME'].should eql('oneadmin')
            vm_hash['VM_POOL']['VM'][2]['NAME'].should eql('vmext')
            vm_hash['VM_POOL']['VM'][2]['LAST_POLL'].should eql('1277910006')
            vm_hash['VM_POOL']['VM'][2]['HISTORY']['HOSTNAME'].should eql('thost')
            vm_hash['VM_POOL']['VM'][2]['HISTORY']['STIME'].should eql('1277377556')
            vm_hash['VM_POOL']['VM'][2]['HISTORY']['REASON'].should eql('0')
        end
    end
    
    describe "VirtualMachinePool using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            client = MockClient.new()
            @vm_pool = VirtualMachinePool.new(client)
        end
        
        it "should update the VM_POOL info" do
            rc = @vm_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the VM_POOL elements and get info from them" do
            rc = @vm_pool.each{ |vm|
                vm.class.to_s.should eql("OpenNebula::VirtualMachine")
                if vm.id == 6
                    vm.name.should eql('vm-example')
                    vm.state.should eql(3)
                    vm.state_str.should eql('ACTIVE')
                elsif vm.id == 8
                    vm.name.should eql('vmext')
                    vm.state.should eql(4)
                    vm.state_str.should eql('STOPPED')
                end
            }
        end
        
        it "should get a hash representation of the VM_POOL" do
            vm_hash = @vm_pool.to_hash
            vm_hash['VM_POOL']['VM'][0]['ID'].should eql('6')
            vm_hash['VM_POOL']['VM'][0]['UID'].should eql('0')
            vm_hash['VM_POOL']['VM'][0]['USERNAME'].should eql('oneadmin')
            vm_hash['VM_POOL']['VM'][0]['NAME'].should eql('vm-example')
            vm_hash['VM_POOL']['VM'][0]['LAST_POLL'].should eql('1277910006')
            vm_hash['VM_POOL']['VM'][0]['HISTORY']['HOSTNAME'].should eql('dummyhost')
            vm_hash['VM_POOL']['VM'][0]['HISTORY']['STIME'].should eql('1277375186')
            vm_hash['VM_POOL']['VM'][0]['HISTORY']['REASON'].should eql('0')
            vm_hash['VM_POOL']['VM'][2]['ID'].should eql('8')
            vm_hash['VM_POOL']['VM'][2]['UID'].should eql('0')
            vm_hash['VM_POOL']['VM'][2]['USERNAME'].should eql('oneadmin')
            vm_hash['VM_POOL']['VM'][2]['NAME'].should eql('vmext')
            vm_hash['VM_POOL']['VM'][2]['LAST_POLL'].should eql('1277910006')
            vm_hash['VM_POOL']['VM'][2]['HISTORY']['HOSTNAME'].should eql('thost')
            vm_hash['VM_POOL']['VM'][2]['HISTORY']['STIME'].should eql('1277377556')
            vm_hash['VM_POOL']['VM'][2]['HISTORY']['REASON'].should eql('0')
        end
    end
end
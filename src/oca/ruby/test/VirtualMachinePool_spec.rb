$: << '../' \
   << './'

require 'OpenNebula'
require 'helpers/MockClient'

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

        it "should iterate the VM_POOL elements and get info from them using to_hash" do
            vm_pool = @vm_pool.to_hash
            
            vm_pool['VM_POOL']['VM'].each{ |vm|
                if vm['ID'] == 6
                    vm.name.should eql('vm-example')
                    vm.state.should eql(3)
                    vm.state_str.should eql('ACTIVE')
                    vm['UID'].should eql('0')
                    vm['USERNAME'].should eql('oneadmin')
                    vm['LAST_POLL'].should eql('1277910006')
                    vm['HISTORY']['HOSTNAME'].should eql('dummyhost')
                    vm['HISTORY']['STIME'].should eql('1277375186')
                    vm['HISTORY']['REASON'].should eql('0')
                elsif vm['ID'] == 8
                    vm.name.should eql('vmext')
                    vm.state.should eql(4)
                    vm.state_str.should eql('STOPPED')
                    vm['UID'].should eql('0')
                    vm['USERNAME'].should eql('oneadmin')
                    vm['LAST_POLL'].should eql('1277910006')
                    vm['HISTORY']['HOSTNAME'].should eql('thost')
                    vm['HISTORY']['STIME'].should eql('1277377556')
                    vm['HISTORY']['REASON'].should eql('0')
                end
            }
        end
        
        it "should iterate the VM_POOL elements and get info from them" do
            rc = @vm_pool.each{ |vm|
                vm.class.to_s.should eql("OpenNebula::VirtualMachine")
                if vm.id == 6
                    vm.name.should eql('vm-example')
                    vm.state.should eql(3)
                    vm.state_str.should eql('ACTIVE')
                    vm['UID'].should eql('0')
                    vm['USERNAME'].should eql('oneadmin')
                    vm['LAST_POLL'].should eql('1277910006')
                    vm['HISTORY/HOSTNAME'].should eql('dummyhost')
                    vm['HISTORY/STIME'].should eql('1277375186')
                    vm['HISTORY/REASON'].should eql('0')
                elsif vm.id == 8
                    vm.name.should eql('vmext')
                    vm.state.should eql(4)
                    vm.state_str.should eql('STOPPED')
                    vm['UID'].should eql('0')
                    vm['USERNAME'].should eql('oneadmin')
                    vm['LAST_POLL'].should eql('1277910006')
                    vm['HISTORY/HOSTNAME'].should eql('thost')
                    vm['HISTORY/STIME'].should eql('1277377556')
                    vm['HISTORY/REASON'].should eql('0')
                end
            }
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
                    vm['UID'].should eql('0')
                    vm['USERNAME'].should eql('oneadmin')
                    vm['LAST_POLL'].should eql('1277910006')
                    vm['HISTORY/HOSTNAME'].should eql('dummyhost')
                    vm['HISTORY/STIME'].should eql('1277375186')
                    vm['HISTORY/REASON'].should eql('0')
                elsif vm.id == 8
                    vm.name.should eql('vmext')
                    vm.state.should eql(4)
                    vm.state_str.should eql('STOPPED')
                    vm['UID'].should eql('0')
                    vm['USERNAME'].should eql('oneadmin')
                    vm['LAST_POLL'].should eql('1277910006')
                    vm['HISTORY/HOSTNAME'].should eql('thost')
                    vm['HISTORY/STIME'].should eql('1277377556')
                    vm['HISTORY/REASON'].should eql('0')
                end
            }
        end
    end
end

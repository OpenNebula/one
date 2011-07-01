$: << '../' \
   << './'

require 'OpenNebula'
require 'helpers/MockClient'

module OpenNebula

    describe "VirtualMachine using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = VirtualMachine.build_xml(6)
            
            client = MockClient.new()
            @vm = VirtualMachine.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should allocate the new VM" do
            @vm.allocate(nil)

            @vm.id.should eql(6)
        end
        
        it "should update the VM info" do
            @vm.info()
            
            @vm.id.should eql(6)
            @vm.name.should eql('vm-example')
            @vm.state.should eql(3)
            @vm.state_str.should eql('ACTIVE')
            @vm.lcm_state.should eql(3)
            @vm.lcm_state_str.should eql('RUNNING')
            @vm.status.should eql('runn')
        end
        
        it "should deploy the VNET" do
            rc = @vm.deploy(nil)

            rc.should eql(nil)
        end
        
        it "should migrate the VNET" do
            rc = @vm.migrate(nil)

            rc.should eql(nil)
        end
        
        it "should live_migrate the VNET" do
            rc = @vm.live_migrate(nil)

            rc.should eql(nil)
        end
        
        it "should shutdown the VNET" do
            rc = @vm.shutdown()

            rc.should eql(nil)
        end
        
        it "should cancel the VNET" do
            rc = @vm.cancel()

            rc.should eql(nil)
        end

        it "should hold the VNET" do
            rc = @vm.hold()

            rc.should eql(nil)
        end
        
        it "should release the VNET" do
            rc = @vm.release()

            rc.should eql(nil)
        end
        
        it "should stop the VNET" do
            rc = @vm.stop()

            rc.should eql(nil)
        end
        
        it "should suspend the VNET" do
            rc = @vm.suspend()

            rc.should eql(nil)
        end
        
        it "should resume the VNET" do
            rc = @vm.resume()

            rc.should eql(nil)
        end
        
        it "should finalize the VNET" do
            rc = @vm.finalize()

            rc.should eql(nil)
        end
        
        it "should restart the VNET" do
            rc = @vm.restart()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @vm['NAME'].should eql('vm-example')
            @vm['DEPLOY_ID'].should eql('dummy')
            @vm['TEMPLATE/MEMORY'].should eql('512')
            @vm['ID'].should eql('6')
            @vm['NAME'].should eql('vm-example')
            @vm['LCM_STATE'].should eql('3')
            @vm['DEPLOY_ID'].should eql('dummy')
            @vm['TEMPLATE/MEMORY'].should eql('512')
            @vm['TEMPLATE/CONTEXT/DNS'].should eql('192.169.1.4')
            @vm['TEMPLATE/DISK/SIZE'].should eql('1024')
            @vm['HISTORY/HOSTNAME'].should eql('dummyhost')
            @vm['HISTORY/PSTIME'].should eql('1277375186')
        end
        
        it "should access an attribute using to_hash" do
            vm_hash = @vm.to_hash
            
            vm_hash['VM']['NAME'].should eql('vm-example')
            vm_hash['VM']['DEPLOY_ID'].should eql('dummy')
            vm_hash['VM']['TEMPLATE']['MEMORY'].should eql('512')
            vm_hash['VM']['ID'].should eql('6')
            vm_hash['VM']['NAME'].should eql('vm-example')
            vm_hash['VM']['LCM_STATE'].should eql('3')
            vm_hash['VM']['DEPLOY_ID'].should eql('dummy')
            vm_hash['VM']['TEMPLATE']['MEMORY'].should eql('512')
            vm_hash['VM']['TEMPLATE']['CONTEXT']['DNS'].should eql('192.169.1.4')
            vm_hash['VM']['TEMPLATE']['DISK'][1]['SIZE'].should eql('1024')
            vm_hash['VM']['HISTORY']['HOSTNAME'].should eql('dummyhost')
            vm_hash['VM']['HISTORY']['PSTIME'].should eql('1277375186')
        end
    end

    describe "VirtualMachine using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = VirtualMachine.build_xml(6)
            
            client = MockClient.new()
            @vm = VirtualMachine.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end

        it "should allocate the new VM" do
            @vm.allocate(nil)

            @vm.id.should eql(6)
        end
        
        it "should update the VM info" do
            @vm.info()
            
            @vm.id.should eql(6)
            @vm.name.should eql('vm-example')
            @vm.state.should eql(3)
            @vm.state_str.should eql('ACTIVE')
            @vm.lcm_state.should eql(3)
            @vm.lcm_state_str.should eql('RUNNING')
            @vm.status.should eql('runn')
        end

        it "should deploy the VNET" do
            rc = @vm.deploy(nil)

            rc.should eql(nil)
        end
        
        it "should migrate the VNET" do
            rc = @vm.migrate(nil)

            rc.should eql(nil)
        end
        
        it "should live_migrate the VNET" do
            rc = @vm.live_migrate(nil)

            rc.should eql(nil)
        end

        it "should shutdown the VNET" do
            rc = @vm.shutdown()

            rc.should eql(nil)
        end
        
        it "should cancel the VNET" do
            rc = @vm.cancel()

            rc.should eql(nil)
        end

        it "should hold the VNET" do
            rc = @vm.hold()

            rc.should eql(nil)
        end
        
        it "should release the VNET" do
            rc = @vm.release()

            rc.should eql(nil)
        end
        
        it "should stop the VNET" do
            rc = @vm.stop()

            rc.should eql(nil)
        end
        
        it "should suspend the VNET" do
            rc = @vm.suspend()

            rc.should eql(nil)
        end
        
        it "should resume the VNET" do
            rc = @vm.resume()

            rc.should eql(nil)
        end
        
        it "should finalize the VNET" do
            rc = @vm.finalize()

            rc.should eql(nil)
        end
        
        it "should restart the VNET" do
            rc = @vm.restart()

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @vm['NAME'].should eql('vm-example')
            @vm['DEPLOY_ID'].should eql('dummy')
            @vm['TEMPLATE/MEMORY'].should eql('512')
            @vm['ID'].should eql('6')
            @vm['NAME'].should eql('vm-example')
            @vm['LCM_STATE'].should eql('3')
            @vm['DEPLOY_ID'].should eql('dummy')
            @vm['TEMPLATE/MEMORY'].should eql('512')
            @vm['TEMPLATE/CONTEXT/DNS'].should eql('192.169.1.4')
            @vm['TEMPLATE/DISK/SIZE'].should eql('1024')
            @vm['HISTORY/HOSTNAME'].should eql('dummyhost')
            @vm['HISTORY/PSTIME'].should eql('1277375186')
        end

        it "should access an attribute using to_hash" do
            vm_hash = @vm.to_hash

            vm_hash['VM']['NAME'].should eql('vm-example')
            vm_hash['VM']['DEPLOY_ID'].should eql('dummy')
            vm_hash['VM']['TEMPLATE']['MEMORY'].should eql('512')
            vm_hash['VM']['ID'].should eql('6')
            vm_hash['VM']['NAME'].should eql('vm-example')
            vm_hash['VM']['LCM_STATE'].should eql('3')
            vm_hash['VM']['DEPLOY_ID'].should eql('dummy')
            vm_hash['VM']['TEMPLATE']['MEMORY'].should eql('512')
            vm_hash['VM']['TEMPLATE']['CONTEXT']['DNS'].should eql('192.169.1.4')
            vm_hash['VM']['TEMPLATE']['DISK'][1]['SIZE'].should eql('1024')
            vm_hash['VM']['HISTORY']['HOSTNAME'].should eql('dummyhost')
            vm_hash['VM']['HISTORY']['PSTIME'].should eql('1277375186')
        end
    end


    describe "VirtualMachine using NOKOGIRI without id" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = VirtualMachine.build_xml()
            
            client = MockClient.new()
            @vm = VirtualMachine.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end
        
        it "should deploy the VNET" do
            rc = @vm.deploy(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should migrate the VNET" do
            rc = @vm.migrate(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should live_migrate the VNET" do
            rc = @vm.live_migrate(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should shutdown the VNET" do
            rc = @vm.shutdown()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should cancel the VNET" do
            rc = @vm.cancel()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should hold the VNET" do
            rc = @vm.hold()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should release the VNET" do
            rc = @vm.release()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should stop the VNET" do
            rc = @vm.stop()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should suspend the VNET" do
            rc = @vm.suspend()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should resume the VNET" do
            rc = @vm.resume()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should finalize the VNET" do
            rc = @vm.finalize()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should restart the VNET" do
            rc = @vm.restart()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should get Error getting info" do
            rc = @vm.info()        
            
            OpenNebula.is_error?(rc).should eql(true)
            @vm.id.should eql(nil)
            @vm.name.should eql(nil)
        end
    end

    describe "VirtualMachine using REXML without id" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = VirtualMachine.build_xml()
            
            client = MockClient.new()
            @vm = VirtualMachine.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end
        
        it "should deploy the VNET" do
            rc = @vm.deploy(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should migrate the VNET" do
            rc = @vm.migrate(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should live_migrate the VNET" do
            rc = @vm.live_migrate(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should shutdown the VNET" do
            rc = @vm.shutdown()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should cancel the VNET" do
            rc = @vm.cancel()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should hold the VNET" do
            rc = @vm.hold()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should release the VNET" do
            rc = @vm.release()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should stop the VNET" do
            rc = @vm.stop()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should suspend the VNET" do
            rc = @vm.suspend()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should resume the VNET" do
            rc = @vm.resume()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should finalize the VNET" do
            rc = @vm.finalize()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should restart the VNET" do
            rc = @vm.restart()

            OpenNebula.is_error?(rc).should eql(true)
        end
        
        it "should get Error getting info" do
            rc = @vm.info()
            
            OpenNebula.is_error?(rc).should eql(true)
            @vm.id.should eql(nil)
            @vm.name.should eql(nil)
        end
    end
end

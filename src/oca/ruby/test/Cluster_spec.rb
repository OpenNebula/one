$: << '../'

require 'OpenNebula'
require 'MockClient'

module OpenNebula

    describe "Cluster using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = Cluster.build_xml(5)
            
            client = MockClient.new()
            @cluster = Cluster.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should allocate the new CLUSTER" do
            @cluster.allocate(nil)

            @cluster.id.should eql(5)
        end
        
        it "should update the CLUSTER info" do
            @cluster.info()
            
            @cluster.id.should eql(5)
            @cluster.name.should eql('Production')
        end
        
        it "should delete the CLUSTER" do
            rc = @cluster.delete()

            rc.should eql(nil)
        end

        it "should add a host to the CLUSTER" do
            rc = @cluster.add_host(nil)

            rc.should eql(nil)
        end

        it "should remove a host from the CLUSTER" do
            rc = @cluster.remove_host(nil)

            rc.should eql(nil)
        end

        it "should access an attribute using []" do
            @cluster['ID'].should eql('5')
            @cluster['NAME'].should eql('Production')
        end

        it "should get a hash representation of the CLUSTER" do
            cluster_hash = @cluster.to_hash
            cluster_hash['CLUSTER']['ID'].should eql('5')
            cluster_hash['CLUSTER']['NAME'].should eql('Production')
        end
    end

    describe "Cluster using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = Cluster.build_xml(5)
            
            client = MockClient.new()
            @cluster = Cluster.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end

        it "should allocate the new CLUSTER" do
            @cluster.allocate(nil)

            @cluster.id.should eql(5)
        end

        it "should update the CLUSTER info" do
            @cluster.info()

            @cluster.id.should eql(5)
            @cluster.name.should eql('Production')
        end
        
        it "should delete the CLUSTER" do
            rc = @cluster.delete()

            rc.should eql(nil)
        end

        it "should add a host to the CLUSTER" do
            rc = @cluster.add_host(nil)

            rc.should eql(nil)
        end

        it "should remove a host from the CLUSTER" do
            rc = @cluster.remove_host(nil)

            rc.should eql(nil)
        end
        
        it "should access an attribute using []" do
            @cluster['ID'].should eql('5')
            @cluster['NAME'].should eql('Production')
        end

        it "should get a hash representation of the CLUSTER" do
            cluster_hash = @cluster.to_hash
            cluster_hash['CLUSTER']['ID'].should eql('5')
            cluster_hash['CLUSTER']['NAME'].should eql('Production')
        end
    end


    describe "Cluster using NOKOGIRI without id" do
        before(:all) do
            NOKOGIRI=true
            
            @xml = Cluster.build_xml()
            
            client = MockClient.new()
            @cluster = Cluster.new(@xml,client)
        end

        it "should create a Nokogiri Node" do
            @xml.class.to_s.should eql('Nokogiri::XML::NodeSet')
        end

        it "should get Error getting info" do
            rc = @cluster.info()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should get Error deleting the CLUSTER" do
            rc = @cluster.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end
    
        it "should add a host to the CLUSTER" do
            rc = @cluster.add_host(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should remove a host from the CLUSTER" do
            rc = @cluster.remove_host(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

    describe "User using REXML without id" do
        before(:all) do
            NOKOGIRI=false
            
            @xml = Cluster.build_xml()
            
            client = MockClient.new()
            @cluster = Cluster.new(@xml,client)
        end

        it "should create a REXML Element" do
            @xml.class.to_s.should eql('REXML::Element')
        end
        
        it "should get Error getting info" do
            rc = @cluster.info()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should get Error deleting the CLUSTER" do
            rc = @cluster.delete()

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should add a host to the CLUSTER" do
            rc = @cluster.add_host(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end

        it "should remove a host from the CLUSTER" do
            rc = @cluster.remove_host(nil)

            OpenNebula.is_error?(rc).should eql(true)
        end
    end

end
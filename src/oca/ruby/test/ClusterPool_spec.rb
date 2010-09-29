$: << '../'

require 'OpenNebula'
require 'helpers/MockClient'

module OpenNebula

    describe "Cluster using NOKOGIRI" do
        before(:all) do
            NOKOGIRI=true
            
            client = MockClient.new()
            @cluster_pool = ClusterPool.new(client)
        end
        
        it "should update the CLUSTER_POOL info" do
            rc = @cluster_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the USER_POOL elements and get info from them" do
            rc = @cluster_pool.each{ |cluster|
                cluster.class.to_s.should eql("OpenNebula::Cluster")
                if cluster.id == 0
                    cluster.name.should eql('default')
                elsif cluster.id == 1
                    cluster.name.should eql('Red')
                elsif cluster.id == 2
                    cluster.name.should eql('Black')
                end
            }
        end
    end
    
    describe "Cluster using REXML" do
        before(:all) do
            NOKOGIRI=false
            
            client = MockClient.new()
            @cluster_pool = ClusterPool.new(client)
        end
        
        it "should update the CLUSTER_POOL info" do
            rc = @cluster_pool.info()
            rc.nil?.should eql(true)
        end

        it "should iterate the CLUSTER_POOL elements and get info from them" do
            rc = @cluster_pool.each{ |cluster|
                cluster.class.to_s.should eql("OpenNebula::Cluster")
                if cluster.id == 0
                    cluster.name.should eql('default')
                elsif cluster.id == 1
                    cluster.name.should eql('Red')
                elsif cluster.id == 2
                    cluster.name.should eql('Black')
                end
            }
        end
    end
end
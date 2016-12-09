module VCenterDriver
class VCenterCachedDatastore

    def initialize(rbVmomiDatastore)
        @ds         = rbVmomiDatastore
        @attributes = Hash.new
    end

    def name
        if !@attributes['name']
            @attributes['name']=@ds.name
        end
        @attributes['name']
    end
end
end

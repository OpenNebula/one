module VCenterDriver

################################################################################
#  Cached Classes to speed up import and monitoring
################################################################################
class VCenterCachedHost

    def initialize(rbVmomiHost)
        @host       = rbVmomiHost
        @attributes = Hash.new
    end

    def name
        if !@attributes['name']
            @attributes['name']=@host.parent.name
        end
        @attributes['name']
    end

    def cluster_name
        if !@attributes['cluster_name']
            @attributes['cluster_name']=@host.parent.name
        end
        @attributes['cluster_name']
    end

    def ds_list
        if !@attributes['ds_list']
            @attributes['ds_list']=""

            datacenter = @host.parent
            while !datacenter.is_a? RbVmomi::VIM::Datacenter
                datacenter = datacenter.parent
            end

            datastores=VIClient.get_entities(
                          datacenter.datastoreFolder,
                           'Datastore')

            storage_pods = VIClient.get_entities(datacenter.datastoreFolder,
                                                'StoragePod')
            storage_pods.each { |sp|
                datastores << sp # Add Storage Pod
                storage_pod_datastores = VIClient.get_entities(sp, 'Datastore')
                if not storage_pod_datastores.empty?
                    datastores.concat(storage_pod_datastores)
                end
            }

            datastores.each { |ds|
                @attributes['ds_list'] += ds.name + ","
            }
            @attributes['ds_list']=@attributes['ds_list'][0..-2]
        end
        @attributes['ds_list']
    end

    def rp_list
        if !@attributes['rp_list']
            @attributes['rp_list']=""
            @host.parent.resourcePool.resourcePool.each{|rp|
                @attributes['rp_list'] += get_child_rp_names(rp, "")
            }
            @attributes['rp_list']=@attributes['rp_list'][0..-2]
        end
        @attributes['rp_list']
    end

    def get_child_rp_names(rp, parent_prefix)
        rp_str = ""

        current_rp = (parent_prefix.empty? ? "" : parent_prefix + "/")
        current_rp += rp.name

        if rp.resourcePool.size != 0
            rp.resourcePool.each{|child_rp|
                rp_str += get_child_rp_names(child_rp, current_rp)
            }
        end

        rp_str += current_rp + ","

        return rp_str
    end

    def cpumhz
        if !@attributes['cpumhz']
            @attributes['cpumhz']=@host.summary.hardware.cpuMhz.to_f
        end
        @attributes['cpumhz']
    end
end
end

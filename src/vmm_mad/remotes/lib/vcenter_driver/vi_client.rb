module VCenterDriver

class VIClient
    attr_accessor :vim

    def initialize(opts)
        opts = {:insecure => true}.merge(opts)
        @vim = RbVmomi::VIM.connect(opts)
    end

    def self.get_entities(folder, type, entities=[])
        if folder == []
            return nil
        end

        folder.childEntity.each do |child|
            the_name, junk = child.to_s.split('(')
            case the_name
            when "Folder"
                get_entities(child, type, entities)
            when type
                entities.push(child)
            end
        end

        return entities
    end
end

end # module VCenterDriver

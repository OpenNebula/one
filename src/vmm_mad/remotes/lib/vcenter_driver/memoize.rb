module Memoize
    def [](property)
        @memoize = {} if !defined?(@memoize)

        if (value = @memoize[property])
            return value
        end

        current_item = @item

        property_path = ""

        property.split(".").each do |elem|
            if property_path.empty?
                property_path << elem
            else
                property_path << "." << elem
            end

            if (val = @memoize[property_path])
                current_item = val
            else
                begin
                    current_item = current_item.send(elem)
                rescue Exception => e
                    current_item = nil
                end
            end

            break if current_item.nil?

            @memoize[property_path] = current_item

        end

        @memoize[property] = current_item
    end

    def []=(property, value)
        @memoize = {} if !defined?(@memoize)

        @memoize[property] = value
    end
end # module Memoize

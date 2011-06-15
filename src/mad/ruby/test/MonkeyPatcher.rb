
class MonkeyPatcher
    def self.patch(&block)
        patcher=self.new

        patcher.instance_eval &block
        patcher.restore_all
    end

    def initialize
        @objects=Hash.new
        @klasses=Hash.new
    end

    def patch_class(klass, function, &block)
        @klasses[klass]={} if !@klasses[klass]
        @klasses[klass][function]=klass.instance_method(function)

        klass.instance_eval do
            define_method(function, block)
        end
    end

    def restore_class(klass)
        @klasses[klass].each do |function, method|
            klass.instance_eval do
                define_method(function, method)
            end
        end
    end

    def restore_all
        @klasses.each do |klass, methods|
            restore_class(klass)
        end
    end
end

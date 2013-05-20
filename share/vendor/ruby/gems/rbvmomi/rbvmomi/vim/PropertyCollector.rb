class RbVmomi::VIM::PropertyCollector
  def collectMultiple objs, *pathSet
    return {} if objs.empty?

    klasses = objs.map{|x| x.class}.uniq 
    klass = if klasses.length > 1
      # common superclass
      klasses.map(&:ancestors).inject(&:&)[0]
    else
      klasses.first
    end

    spec = {
      :objectSet => objs.map{|x| { :obj => x }},
      :propSet => [{
        :pathSet => pathSet,
        :type => klass.wsdl_name
      }]
    }
    res = RetrieveProperties(:specSet => [spec])
    Hash[res.map do |x|
      [x.obj, x.to_hash]
    end]
  end
end

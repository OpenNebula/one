require 'date'

class Time
  def to_datetime
    # Convert seconds + microseconds into a fractional number of seconds
    seconds = sec + Rational(usec, 10**6)

    # Convert a UTC offset measured in minutes to one measured in a
    # fraction of a day.
    offset = Rational(utc_offset, 60 * 60 * 24)
    DateTime.new(year, month, day, hour, min, seconds, offset)
  end
end

RbVmomi::VIM::PerformanceManager
class RbVmomi::VIM::PerformanceManager
  def perfcounter_cached
    @perfcounter ||= perfCounter
  end
  
  def perfcounter_hash
    @perfcounter_hash ||= Hash[perfcounter_cached.map{|x| [x.name, x]}]
  end
  
  def perfcounter_idhash 
    @perfcounter_idhash ||= Hash[perfcounter_cached.map{|x| [x.key, x]}]
  end
  
  def provider_summary obj
    @provider_summary ||= {}
    @provider_summary[obj.class] ||= QueryPerfProviderSummary(:entity => obj)
  end

  def retrieve_stats objects, metrics, opts = {}
    opts = opts.dup
    max_samples = opts[:max_samples] || 1
    realtime = false
    if not opts[:interval]
      provider = provider_summary objects.first
      opts[:interval] = provider.refreshRate
      realtime = true
    else
      provider = provider_summary objects.first
      if opts[:interval] == provider.refreshRate
        realtime = true
      end
    end
      
    instances = opts[:instance] || '*'
    if !instances.is_a?(Array)
      instances = [instances]
    end
    metric_ids = []
    metrics.each do |x| 
      counter = perfcounter_hash[x]
      if !counter
        pp perfcounter_hash.keys
        fail "Counter for #{x} couldn't be found"
      end
      instances.each do |instance|
        metric_ids << RbVmomi::VIM::PerfMetricId(:counterId => counter.key, 
                                                 :instance => instance)
      end
    end
    query_specs = objects.map do |obj|
      RbVmomi::VIM::PerfQuerySpec({
        :maxSample => max_samples, 
        :entity => obj, 
        :metricId => metric_ids, 
        :intervalId => opts[:interval],
        :startTime => (realtime == false ? opts[:start_time].to_datetime : nil),
      })
    end
    stats = QueryPerf(:querySpec => query_specs)
    
    if !opts[:multi_instance]
      Hash[stats.map do |res|
        [
          res.entity, 
          {
            :sampleInfo => res.sampleInfo,
            :metrics => Hash[res.value.map do |metric|
              metric_name = perfcounter_idhash[metric.id.counterId].name
              [metric_name, metric.value]
            end]
          }
        ]
      end]
    else
      Hash[stats.map do |res|
        [
          res.entity, 
          {
            :sampleInfo => res.sampleInfo,
            :metrics => Hash[res.value.map do |metric|
              metric_name = perfcounter_idhash[metric.id.counterId].name
              [[metric_name, metric.id.instance], metric.value]
            end]
          }
        ]
      end]
    end
  end


  def active_intervals
    intervals = historicalInterval
    Hash[(1..4).map { |level| [level, intervals.select { |x| x.enabled && x.level >= level }] }]
  end
end

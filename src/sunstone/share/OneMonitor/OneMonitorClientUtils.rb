module OneMonitorCSVClient
    def readOneMonitorFile(file_name,columns,length)
        first_line = `head -1 #{file_name}`.chomp

        if $?.exitstatus != 0
            return [] #silently fail, cannot find this file
        end

        n_lines = `wc -l #{file_name} | cut -d' ' -f 1`.to_i
        if n_lines <= length.to_i
            length = n_lines-1
        end

        fields = first_line.split(',')
        poll_time_pos = fields.index("time")

        if !poll_time_pos
            return [] #silently fail, no timestamp
        end

        tail = `tail -#{length} #{file_name}`
        series = [] #will hold several graphs

        columns.each do | column_name |

            graph = []
            column_pos = fields.index(column_name)
            next unless column_pos

            tail.each_line do | line |
                line_arr = line.delete('"').split(',')
                graph << [ line_arr[poll_time_pos].to_i*1000, line_arr[column_pos].to_i ]
            end

            series << graph
        end

        return series
    end
end

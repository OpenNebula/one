
if ARGV.length != 2
    puts "This script requires two file paths to sqlite DBs"
    exit -1
end


file_path_a = ARGV[0]
file_path_b = ARGV[1]

lines_a = Array.new
lines_b = Array.new


# The sqlite3 command is used to dump the DB schema it to
# a file

`sqlite3 #{file_path_a} ".schema" > #{file_path_a}.schema`
`sqlite3 #{file_path_b} ".schema" > #{file_path_b}.schema`

# Read the lines into an array
File.open( "#{file_path_a}.schema" ) do |f|
    lines_a = f.readlines
end

File.open( "#{file_path_b}.schema" ) do |f|
    lines_b = f.readlines
end


diff_array = (lines_a | lines_b) - (lines_a & lines_b)

if !diff_array.empty?
    puts "Schema does not match. Conflictive lines:"
    puts diff_array

    exit -1
end

exit 0
PROTO_DIR = ../../../../rm/grpc/proto
SOURCES   = $(wildcard $(PROTO_DIR)/*.proto)
TS     = .proto_built

.PHONY: all clean

all: $(TS)

$(TS): $(SOURCES)
	grpc_tools_ruby_protoc -I$(PROTO_DIR) --ruby_out=. --grpc_out=. $(PROTO_DIR)/*.proto
	@touch $(TS)

clean:
	rm -f *_pb.rb $(TS)

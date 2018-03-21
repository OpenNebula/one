.PHONY: build test help default

default: test

help:
	@echo 'Management commands for goca:'
	@echo
	@echo 'Usage:'
	@echo '    make test            Run the tests.'
	@echo '    make get-deps        runs glide install, mostly used for ci.'
	@echo

test:
	go test $(glide nv)
	golint $(glide nv)

get-deps:
	glide install

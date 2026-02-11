name=nyaccabulary

build:
	go build -buildvcs=false -o ${name}

build-release:
	go build -o ${name} -ldflags "-s -w"

run:
	./${name}

reflex:
	reflex -R '\.git' -r '\.go' -s -- make build run

mongo-start:
	brew services start mongodb-community

mongo-stop:
	brew services stop mongodb-community

mongo-info:
	brew services info mongodb-community

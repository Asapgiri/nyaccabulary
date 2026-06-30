name=nyaccabulary

build:
	go build -buildvcs=false -o ${name} ./server

build-release:
	go build -o ${name} -ldflags "-s -w" ./server

run:
	./${name}

run-react:
	cd web; VITE_API_URL="https://localhost:3000" npm run dev

reflex:
	reflex -R '\.git' -r '\.go' -s -- make build run

mongo-start:
	brew services start mongodb-community

mongo-stop:
	brew services stop mongodb-community

mongo-info:
	brew services info mongodb-community

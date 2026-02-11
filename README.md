# Nyaccabulary site

My persolan brain damage to learn japanse I guess...

# Inti steps
- Install `go`
- Install [mongoDB](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)

## Configs
The `.config.json` file will be created after the first run with the following defaults:
```json
{
  "Http": {
    "Url": "",
    "Port": "3000"
  },
  "Dbase": {
    "Url": "mongodb://localhost:27017",
    "Name": "nyaccabulary"
  },
  // { ... }
}
```

By default I use pound for reverse proxy, but I don't feel like sharing my config with you...

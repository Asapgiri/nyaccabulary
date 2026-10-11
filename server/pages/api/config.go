package api

import (
	"net/http"
	"nyaccabulary/server/config"
)

// PublicConfig returns settings that the browser needs for client-side services.
func PublicConfig(w http.ResponseWriter, _ *http.Request) {
	write_json(w, struct {
		GiphyAPIKey string `json:"giphyApiKey"`
	}{GiphyAPIKey: config.Config.Giphy.ApiKey})
}

package pages

import (
	"encoding/json"
	"io"
	"net/http"
	"time"
)

func request(method string, path string, payload interface{}, token string) *http.Response {
    requestUrl := "https://manga-kotoba.com" + path

	req, _ := http.NewRequest("GET", requestUrl, nil)

    req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", "Bearer " + token)

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

    json.Unmarshal(body, payload)

	// Optional: full raw struct for debugging
	log.Println("---- RAW STRUCT ----")
	raw, _ := json.MarshalIndent(payload, "", "  ")
	log.Println(string(raw))

    return res
}


type MkMe struct {
    Data    struct {
        User    struct {
            Id        int       `json:"id"`
            Name      string    `json:"name"`
            Email     string    `json:"email"`
            Role      int       `json:"role"`
            RoleName  string    `json:"roleName"`
            IsDemo    bool      `json:"isDemo"`
            CreatedAt time.Time `json:"createdAt"`
        } `json:"user"`
        Stats   struct {
            KnownWords          int `json:"knownWords"`
            SeriesTracked       int `json:"seriesTracked"`
            SeriesReading       int `json:"seriesReading"`
            SeriesFinished      int `json:"seriesFinished"`
            SeriesPlanToRead    int `json:"seriesPlanToRead"`
            SeriesDropped       int `json:"seriesDropped"`
        } `json:"stats"`
    } `json:"data"`
}

type MkWords struct {
    Data    []struct {
        DictionaryId int         `json:"dictionaryId"`
        Reading      string      `json:"reading"`
        CreatedAt    *time.Time  `json:"createdAt"` // can be null
        UpdatedAt    *time.Time  `json:"updatedAt"` // can be null
        WordData     interface{} `json:"wordData"`  // generic container
    } `json:"data"`
    Meta    struct {
        Total           int  `json:"total"`
        PerPage         int  `json:"perPage"`
        Page            int  `json:"page"`
        LastPage        int  `json:"lastPage"`
        HasNextPage     bool `json:"hasNextPage"`
        HasPreviousPage bool `json:"hasPreviousPage"`
    } `json:"meta"`
}

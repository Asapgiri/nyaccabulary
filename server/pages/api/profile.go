package api

import (
	"net/http"
	"nyaccabulary/server/dbase"
	"nyaccabulary/server/logic"
	"time"
)

type PublicProfile struct {
	Username string
	Name     string
	RegDate  time.Time
	Email    string `json:",omitempty"`
	Phone    string `json:",omitempty"`
	Words    dbase.ProfileStats
	Kanjis   dbase.ProfileStats
	Activity []dbase.ProfileActivity
	Rank     int
	Ranking  []dbase.ProfileRanking
}

func UserProfile(w http.ResponseWriter, r *http.Request) {

	log.Println("User profile...")

	user := logic.User{}
	user.FindByUsername(r.PathValue("username"))
	if user.Id == "" {
		http.NotFound(w, r)
		return
	}
	progress, err := dbase.GetProfileProgress(user.Id)
	if err != nil {
		http.Error(w, "Could not load profile", http.StatusInternalServerError)
		return
	}
	activity, err := dbase.GetProfileActivity(user.Id, 365)
	if err != nil {
		http.Error(w, "Could not load activity", http.StatusInternalServerError)
		return
	}
	ranking, err := dbase.GetProfileRanking()
	if err != nil {
		http.Error(w, "Could not load ranking", http.StatusInternalServerError)
		return
	}
	rank := 0
	for _, entry := range ranking {
		if entry.Id.Hex() == user.Id {
			rank = entry.Rank
			break
		}
	}
	if len(ranking) > 10 {
		ranking = ranking[:10]
	}
	public := PublicProfile{
		Username: user.Username,
		Name:     user.Name,
		RegDate:  user.RegDate,
		Words:    progress.Words,
		Kanjis:   progress.Kanjis,
		Activity: activity,
		Rank:     rank,
		Ranking:  ranking,
	}
	if user.EmailVisible {
		public.Email = user.Email
	}
	if user.PhoneVisible {
		public.Phone = user.Phone
	}
	write_json(w, public)
}

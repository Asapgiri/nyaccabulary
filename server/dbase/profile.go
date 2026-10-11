package dbase

import (
	"context"
	"sort"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProfileStats struct {
	Count    int64
	Mastered int64
}

type ProfileProgress struct {
	Words  ProfileStats
	Kanjis ProfileStats
}

type ProfileActivity struct {
	Date  time.Time
	Count int
}

type ProfileRanking struct {
	Id       primitive.ObjectID `json:"-"`
	Username string
	Name     string
	Mastered int64
	Rank     int
}

type profileAggregate struct {
	User     primitive.ObjectID `bson:"_id"`
	Mastered int64              `bson:"mastered"`
}

func collectionProfileStats(collection *mongo.Collection, userID string) (ProfileStats, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ProfileStats{}, err
	}
	count, err := collection.CountDocuments(context.Background(), bson.D{{Key: "user", Value: userObjectID}})
	if err != nil {
		return ProfileStats{}, err
	}
	mastered, err := collection.CountDocuments(context.Background(), bson.D{{Key: "user", Value: userObjectID}, {Key: "status", Value: "MASTERED"}})
	return ProfileStats{Count: count, Mastered: mastered}, err
}

func GetProfileProgress(userID string) (ProfileProgress, error) {
	words, err := collectionProfileStats(dbWORDS, userID)
	if err != nil {
		return ProfileProgress{}, err
	}
	kanjis, err := collectionProfileStats(dbKANJI, userID)
	if err != nil {
		return ProfileProgress{}, err
	}
	return ProfileProgress{Words: words, Kanjis: kanjis}, nil
}

func profileAggregates(collection *mongo.Collection) ([]profileAggregate, error) {
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$user"},
			{Key: "mastered", Value: bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{bson.D{{Key: "$eq", Value: bson.A{"$status", "MASTERED"}}}, 1, 0}}}}}},
		}}},
	}
	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())
	var results []profileAggregate
	if err := cursor.All(context.Background(), &results); err != nil {
		return nil, err
	}
	return results, nil
}

func GetProfileActivity(userID string, days int) ([]ProfileActivity, error) {
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	from := time.Now().UTC().AddDate(0, 0, -days)
	counts := map[string]int{}
	for _, collection := range []*mongo.Collection{dbWORDS, dbKANJI} {
		cursor, err := collection.Find(context.Background(), bson.D{
			{Key: "user", Value: userObjectID},
			{Key: "lastupdated", Value: bson.D{{Key: "$gte", Value: from}}},
		}, options.Find().SetProjection(bson.D{{Key: "lastupdated", Value: 1}}))
		if err != nil {
			return nil, err
		}
		var items []struct {
			LastUpdated time.Time `bson:"lastupdated"`
		}
		if err := cursor.All(context.Background(), &items); err != nil {
			cursor.Close(context.Background())
			return nil, err
		}
		cursor.Close(context.Background())
		for _, item := range items {
			counts[item.LastUpdated.UTC().Format("2006-01-02")]++
		}
	}
	result := make([]ProfileActivity, 0, len(counts))
	for date, count := range counts {
		parsed, _ := time.Parse("2006-01-02", date)
		result = append(result, ProfileActivity{Date: parsed, Count: count})
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Date.Before(result[j].Date) })
	return result, nil
}

func GetProfileRanking(userID string) ([]ProfileRanking, error) {
	wordStats, err := profileAggregates(dbWORDS)
	if err != nil {
		return nil, err
	}
	kanjiStats, err := profileAggregates(dbKANJI)
	if err != nil {
		return nil, err
	}
	mastered := map[primitive.ObjectID]int64{}
	for _, row := range wordStats {
		mastered[row.User] += row.Mastered
	}
	for _, row := range kanjiStats {
		mastered[row.User] += row.Mastered
	}
	users, err := (&User{}).List()
	if err != nil {
		return nil, err
	}
	ranking := make([]ProfileRanking, 0, len(users))
	for _, user := range users {
		ranking = append(ranking, ProfileRanking{Id: user.Id, Username: user.Username, Name: user.Name, Mastered: mastered[user.Id]})
	}
	sort.Slice(ranking, func(i, j int) bool {
		if ranking[i].Mastered == ranking[j].Mastered {
			return ranking[i].Username < ranking[j].Username
		}
		return ranking[i].Mastered > ranking[j].Mastered
	})
	target, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	for i := range ranking {
		if ranking[i].Id == target {
			ranking[i].Rank = i + 1
		}
	}
	return ranking, nil
}

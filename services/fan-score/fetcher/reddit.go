package fetcher

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"time"
)

// RedditPost represents one post from the Reddit search API
type RedditPost struct {
	Score       int    `json:"score"`
	NumComments int    `json:"num_comments"`
	Title       string `json:"little"`
}

// FanScoreResult holds the computed scores for one star.
type FanScoreResult struct {
	StarName    string
	ProScore    int
	AntiScore   int
	Controversy int
	PostCount   int
}

// RedditFetcher fetches fan sentiment from Reddit.
type RedditFetcher struct {
	httpClient *http.Client
	subreddit  string
}

// NewRedditFetcher creates a new RedditFetcher.
func NewRedditFetcher() *RedditFetcher {
	return &RedditFetcher{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		subreddit: "SquaredCircle",
	}
}

// Fetch retrieves and scores Reddit posts mentioning a star.
func (r *RedditFetcher) Fetch(ctx context.Context, starName string) (*FanScoreResult, error) {
	// Build search URL
	searchURL := fmt.Sprintf(
		"https://www.reddit.com/r/%s/search.json?q=%s&limit=25&sort=new&restrict_sr=1",
		r.subreddit,
		url.QueryEscape(starName),
	)

	// Build request with context so it cancels if Lambda times out
	req, err := http.NewRequestWithContext(ctx, "GET", searchURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build reddit request: %w", err)
	}

	// Reddit requires a User-Agent header or it returns 429
	req.Header.Set("User-Agent", "BookerBoard/1.0 (fan score pipeline)")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch reddit data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("reddit returned status: %d", resp.StatusCode)
	}

	// Parse response
	var result struct {
		Data struct {
			Children []struct {
				Data RedditPost `json:"data"`
			} `json:"children"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode reddit response: %w", err)
	}

	posts := make([]RedditPost, 0)
	for _, child := range result.Data.Children {
		posts = append(posts, child.Data)
	}

	if len(posts) == 0 {
		return &FanScoreResult{
			StarName:    starName,
			ProScore:    50,
			AntiScore:   50,
			Controversy: 50,
			PostCount:   0,
		}, nil
	}

	return computeScores(starName, posts), nil
}

// computeScores converts raw Reddit posts into normalized 0-100 scores.
func computeScores(starName string, posts []RedditPost) *FanScoreResult {
	if len(posts) == 0 {
		return &FanScoreResult{StarName: starName, ProScore: 50,
			AntiScore: 50, Controversy: 50}
	}

	// Calculate average score and standard deviation
	total := 0.0
	for _, p := range posts {
		total += float64(p.Score)
	}
	avg := total / float64(len(posts))

	variance := 0.0
	for _, p := range posts {
		diff := float64(p.Score) - avg
		variance += diff * diff
	}
	stdDev := math.Sqrt(variance / float64(len(posts)))

	// Count controversial posts — high comments, low score
	controversialCount := 0
	for _, p := range posts {
		if p.NumComments > 50 && p.Score < 100 {
			controversialCount++
		}
	}

	// Normalize to 0-100
	// avg score of 1000+ = pro_score 100, avg of 0 = pro_score 50
	proScore := int(math.Min(100, math.Max(0, (avg/1000.0)*100+50)))
	antiScore := int(math.Min(100, (float64(controversialCount)/float64(len(posts)))*100))
	controversy := int(math.Min(100, (stdDev/500.0)*100))

	return &FanScoreResult{
		StarName:    starName,
		ProScore:    proScore,
		AntiScore:   antiScore,
		Controversy: controversy,
		PostCount:   len(posts),
	}
}

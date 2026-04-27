use scraper::{Html, Selector};
use std::error::Error;

// MatchScore holds the scraped rating data for one star.
pub struct MatchScore {
    pub star_name: String,
    pub avg_rating: f64,
    pub rating_count: i32,
}

// CagematchScraper fetches and parses match ratings from CAGEMATCH.
pub struct CagematchScraper {
    client: reqwest::blocking::Client,
}

impl CagematchScraper {
    // Creates a new scraper with a browser-like User-Agent.
    pub fn new() -> Result<Self, Box<dyn Error + Send + Sync>> {
        let client = reqwest::blocking::Client::builder()
            .user_agent("Mozilla/5.0 (compatible: BookerBoard/1.0)")
            .timeout(std::time::Duration::from_secs(15))
            .build()?;

        Ok(CagematchScraper { client })
    }

    // Scrapes CAGEMATCH for a star's average math rating.
    // Returns None if the star is not found on CAGEMATCH.
    pub fn scrape(&self, star_name: &str) -> Result<Option<MatchScore>, Box<dyn Error  + Send + Sync>> {
        // Build search URL
        let url = format!(
            "https://www.cagematch.net/?id=2&action=workerMatches&name={}",
            urlencoding::encode(star_name)
        );

        let response = self.client.get(&url).send()?;

        if !response.status().is_success() {
            return Ok(None);
        }

        let html = response.text()?;
        let score = parse_rating(&html, star_name)?;
        Ok(score)
    }   
}

// Parses the average rating and count from CAGEMATCH HTML.
// CAGEMATCH displays ratings in a div with class "RatingNum".
fn parse_rating(html: &str, star_name: &str) -> Result<Option<MatchScore>, Box<dyn Error + Send + Sync>> {
    let document = Html::parse_document(html);

    // CAGEMATCH rating selector - targets the numeric rating display
    let rating_selector = Selector::parse(".RatingNum").map_err(|e| {
        format!("failed to parse rating selector: {}", e)
    })?;

    let count_selector = Selector::parse(".RatingCount").map_err(|e| {
        format!("failed to parse count selector: {}", e)
    })?;

    // Extract rating value
    let rating_text = document
        .select(&rating_selector)
        .next()
        .map(|e1| e1.text().collect::<String>());

    let count_text = document
        .select(&count_selector)
        .next()
        .map(|e1| e1.text().collect::<String>());

    match (rating_text, count_text) {
        (Some(rating), Some(count)) => {
            // Parse "8.75" -> f64
            let avg_rating = rating.trim().parse::<f64>().unwrap_or(0.0);
        
            // Parse "(12345 votes)" -> i32
            let rating_count = count
                .trim()
                .replace("(", "")
                .replace(")", "")
                .replace(" votes", "")
                .replace(",", "")
                .trim()
                .parse::<i32>()
                .unwrap_or(0);

            Ok(Some(MatchScore {
                star_name: star_name.to_string(),
                avg_rating,
                rating_count,
            }))
        }

        _ => Ok(None), // Star not found or no ratings yet
    }
}
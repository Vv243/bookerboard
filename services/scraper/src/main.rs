mod scraper;
mod db;

use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use serde_json::Value;
use std::env;

// Lambda handler - called once per invocation.
async fn handler(event: LambdaEvent<Value>) -> Result<Value, Error> {
    println!("CAGEMATCH scraper started - {:?}", event.context.request_id);

    let database_url = env::var("DATABASE_URL")
        .map_err(|_| "DATABASE_URL environment variable not set")?;

    // Connect to PostgresSQL
    let client = db::connect(&database_url).await?;

    // Get all star names
    let star_names = db::get_all_star_names(&client).await?;
    println!("scraping {} stars", star_names.len());

    // Initialize scraper
    let cagematch = scraper::CagematchScraper::new()?;

    let mut success_count = 0;
    let mut skip_count = 0;
    let mut error_count = 0;

    for star_name in &star_names {
        match cagematch.scrape(star_name) {
            Ok(Some(score)) => {
                println!(
                    "{} - rating: {:.2} ({} votes)",
                    star_name, score.avg_rating, score.rating_count
                );
                if let Err(e) = db::write_cagematch_score(&client, &score).await {
                    eprintln!("failed to write score for {}: {}", star_name, e);
                    error_count += 1;
                } else {
                    success_count += 1;
                }
            }
            Ok(None) =>{
                println!("{} - not found on CAGEMATCH", star_name);
                skip_count += 1;
            }
            Err(e) => {
                eprintln!("scrape failed for {}: {}", star_name, e);
                error_count += 1;
            }
        }
    }

    println!(
        "scraper complete - {} written, {} skipped, {} errors",
        success_count, skip_count, error_count
    );

    Ok(serde_json::json!({
        "success": success_count,
        "skipped": skip_count,
        "errors": error_count,
    }))
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}
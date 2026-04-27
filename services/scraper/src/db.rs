use std::error::Error;
use tokio_postgres::{Client, NoTls};

use crate::scraper::MatchScore;

// Connects to PostgresSQL and returns a client.
pub async fn connect(database_url: &str) -> Result<Client, Box<dyn Error + Send + Sync>> {
    let (client, connection) = tokio_postgres::connect(database_url, NoTls).await?;

    // The connection runs in the background - spawn it as a task
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("PostgreSQL connection error: {}", e);
        }
    });

    Ok(client)
}

/// Writes a CAGEMATCH score to the match_history table.
/// Updates cagematch_score on the most recent match for this star.
pub async fn write_cagematch_score(
    client: &Client,
    score: &MatchScore,
)-> Result<(), Box<dyn Error + Send + Sync>> {
    // Find the most recent match history row fot this star
    // and update its cagematch_score
    let rows_updated = client
        .execute(
            "UPDATE match_history
             SET cagematch_score = $1
             WHERE id = (
                 SELECT mh.id
                 FROM match_history mh
                 JOIN star s ON s.id = mh.winner_id OR s.id = mh.loser_id
                 WHERE s.name = $2
                 ORDER BY mh.created_at DESC
                 LIMIT 1
             )",
            &[&score.avg_rating, &score.star_name],
        )
        .await?;

    if rows_updated == 0 {
        // No match history yet - log and continue
        eprintln!(
            "no match history found for {} - skipping cagematch score write",
            score.star_name
        );
    }

    Ok(())
}

/// Returns all star names from the database.
pub async fn get_all_star_names(client: &Client) -> Result<Vec<String>, Box<dyn Error + Send + Sync>> {
    let rows = client
        .query("SELECT name FROM star ORDER BY name", &[])
        .await?;
    
    let names = rows.iter().map(|row| row.get::<_, String>(0)).collect();
    Ok(names)
}
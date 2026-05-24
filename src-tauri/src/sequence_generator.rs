use sqlx::{SqlitePool, query_as};
use chrono::Local;

/// Generate a new Purchase Order number with pattern: PO-YYYYMMDD-XXXX
/// where YYYYMMDD is the current date, and XXXX is a zero-padded 4-digit sequence
/// that resets each day.
/// Example: PO-20250524-0042
pub async fn generate_po_number(pool: &SqlitePool) -> Result<String, String> {
    let current_date = Local::now().format("%Y%m%d").to_string();
    let pattern = format!("PO-{}-%", current_date);

    // Query the highest sequence number for the current date
    let row: Option<(i64,)> = query_as::<_, (i64,)>(
        r#"
        SELECT CAST(SUBSTR(po_number, INSTR(po_number, '-') + 10) AS INTEGER) AS seq
        FROM purchase_orders
        WHERE po_number LIKE ?
        ORDER BY seq DESC
        LIMIT 1
        "#,
    )
    .bind(&pattern)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let next_seq = match row {
        Some((max_seq,)) => max_seq + 1,
        None => 1,
    };

    Ok(format!("PO-{}-{:04}", current_date, next_seq))
}

/// Generate a SKU for a product.
/// Strategy: first letters of product name (up to 3) + current date (YYYYMMDD) + incremental 4-digit number.
/// Example: "Wireless Mouse" -> "WMO-20250524-0001", then "WMO-20250524-0002", etc.
/// This ensures SKUs are readable, unique, and reset daily.
pub async fn generate_sku(product_name: &str, pool: &SqlitePool) -> Result<String, String> {
    if product_name.is_empty() {
        return Err("Product name cannot be empty".to_string());
    }

    // Create prefix: take first letters of each word, up to 3 chars total
    let prefix: String = product_name
        .split_whitespace()
        .filter_map(|word| word.chars().next())
        .take(3)
        .collect::<String>()
        .to_uppercase();

    // If prefix is too short (e.g., single letter), pad with 'X'
    let prefix = if prefix.len() < 2 {
        format!("{}X", prefix)
    } else {
        prefix
    };

    let current_date = Local::now().format("%Y%m%d").to_string();
    let pattern = format!("{}-{}-%", prefix, current_date);

    // Query the highest number for this prefix + date
    let row: Option<(i64,)> = query_as::<_, (i64,)>(
        r#"
        SELECT CAST(SUBSTR(sku, INSTR(sku, '-') + 10) AS INTEGER) AS seq
        FROM products
        WHERE sku LIKE ?
        ORDER BY seq DESC
        LIMIT 1
        "#,
    )
    .bind(&pattern)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let next_seq = match row {
        Some((max_seq,)) => max_seq + 1,
        None => 1,
    };

    Ok(format!("{}-{}-{:04}", prefix, current_date, next_seq))
}

use rusqlite::{Connection, Result};
use tauri::{AppHandle, Manager};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
pub struct Transaction {
    pub id: i32,
    pub description: String,
    pub amount: f64,
    #[serde(rename = "transaction_type")]
    pub transaction_type: String,
    pub date: String,
}

#[derive(Serialize, Deserialize)]
pub struct Note {
    pub id: i32,
    pub content: String,
}

#[derive(Deserialize, Debug)]
pub struct TransactionInput {
    pub description: String,
    pub amount: f64,
    #[serde(rename = "transaction_type")]
    pub transaction_type: String,
    pub date: String,
}

#[derive(Deserialize, Debug)]
pub struct NoteInput {
    pub content: String,
}

#[derive(Serialize, Debug)]
pub struct Day {
    pub date: String,
}

fn get_db_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    let db_path = app_data_dir.join("app.db");
    println!("Database path: {:?}", db_path);
    Ok(db_path)
}

#[tauri::command]
pub fn init_db(app_handle: AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    conn.execute("BEGIN TRANSACTION", [])
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            transaction_type TEXT NOT NULL,
            date TEXT NOT NULL
        )",
        (),
    )
    .map_err(|e| format!("Failed to create transactions table: {}", e))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS days (
            date TEXT PRIMARY KEY
        )",
        (),
    )
    .map_err(|e| format!("Failed to create days table: {}", e))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        (),
    )
    .map_err(|e| format!("Failed to create metadata table: {}", e))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL
        )",
        (),
    )
    .map_err(|e| format!("Failed to create notes table: {}", e))?;
    let install_date = chrono::Local::now().format("%d.%m.%Y").to_string();
    conn.execute(
        "INSERT OR IGNORE INTO metadata (key, value) VALUES (?1, ?2)",
        ["install_date", install_date.as_str()],
    )
    .map_err(|e| format!("Failed to insert install date: {}", e))?;
    conn.execute(
        "INSERT OR IGNORE INTO metadata (key, value) VALUES (?1, ?2)",
        ["currency", "€"],
    )
    .map_err(|e| format!("Failed to insert default currency: {}", e))?;
    conn.execute(
        "INSERT OR IGNORE INTO metadata (key, value) VALUES (?1, ?2)",
        ["language", "en"],
    )
    .map_err(|e| format!("Failed to insert default language: {}", e))?;
    conn.execute("COMMIT", [])
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_transactions(app_handle: AppHandle) -> Result<Vec<Transaction>, String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    let mut stmt = conn
        .prepare("SELECT id, description, amount, transaction_type, date FROM transactions")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    let transactions = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                description: row.get(1)?,
                amount: row.get(2)?,
                transaction_type: row.get(3)?,
                date: row.get(4)?,
            })
        })
        .map_err(|e| format!("Failed to query transactions: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect transactions: {}", e))?;
    Ok(transactions)
}

#[tauri::command]
pub fn get_notes(app_handle: AppHandle) -> Result<Vec<Note>, String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    let mut stmt = conn
        .prepare("SELECT id, content FROM notes")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    let notes = stmt
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                content: row.get(1)?,
            })
        })
        .map_err(|e| format!("Failed to query notes: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect notes: {}", e))?;
    Ok(notes)
}

#[tauri::command]
pub fn add_transaction(app_handle: AppHandle, transaction: TransactionInput) -> Result<(), String> {
    println!("Adding transaction: {:?}", transaction);
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    conn.execute(
        "INSERT INTO transactions (description, amount, transaction_type, date) VALUES (?1, ?2, ?3, ?4)",
        (
            &transaction.description,
            &transaction.amount,
            &transaction.transaction_type,
            &transaction.date,
        ),
    )
    .map_err(|e| format!("Failed to insert transaction: {}", e))?;
    let date = NaiveDate::parse_from_str(&transaction.date, "%d.%m.%Y")
        .map_err(|e| format!("Failed to parse date: {}", e))?;
    conn.execute(
        "INSERT OR IGNORE INTO days (date) VALUES (?1)",
        [date.format("%d.%m.%Y").to_string()],
    )
    .map_err(|e| format!("Failed to insert day: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn add_note(app_handle: AppHandle, note: NoteInput) -> Result<(), String> {
    println!("Adding note: {:?}", note);
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    conn.execute(
        "INSERT INTO notes (content) VALUES (?1)",
        [&note.content],
    )
    .map_err(|e| format!("Failed to insert note: {}", e))?;
    Ok(())
}

// update_transaction
#[tauri::command]
pub fn update_transaction(app_handle: AppHandle, transaction: Transaction) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Get the old date before updating
    let old_date: String = conn.query_row(
        "SELECT date FROM transactions WHERE id = ?1",
        [transaction.id],
        |row| row.get(0),
    ).map_err(|e| format!("Failed to get old transaction date: {}", e))?;

    // Update the transaction
    conn.execute(
        "UPDATE transactions SET description = ?1, amount = ?2, transaction_type = ?3, date = ?4 WHERE id = ?5",
        (
            &transaction.description,
            &transaction.amount,
            &transaction.transaction_type,
            &transaction.date,
            &transaction.id,
        ),
    )
    .map_err(|e| format!("Failed to update transaction: {}", e))?;

    // Insert the new date (if not exists)
    let new_date = &transaction.date;
    let parsed_date = NaiveDate::parse_from_str(new_date, "%d.%m.%Y")
        .map_err(|e| format!("Failed to parse new date: {}", e))?;
    conn.execute(
        "INSERT OR IGNORE INTO days (date) VALUES (?1)",
        [parsed_date.format("%d.%m.%Y").to_string()],
    )
    .map_err(|e| format!("Failed to insert new day: {}", e))?;

    // If the date changed, check and clean up the old date
    if old_date != *new_date {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM transactions WHERE date = ?1",
            [&old_date],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to count remaining transactions on old date: {}", e))?;

        if count == 0 {
            conn.execute("DELETE FROM days WHERE date = ?1", [&old_date])
                .map_err(|e| format!("Failed to delete old day: {}", e))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn update_note(app_handle: AppHandle, note: Note) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    conn.execute(
        "UPDATE notes SET content = ?1 WHERE id = ?2",
        (&note.content, &note.id),
    )
    .map_err(|e| format!("Failed to update note: {}", e))?;
    Ok(())
}

// delete_transaction
#[tauri::command]
pub fn delete_transaction(app_handle: AppHandle, id: i32) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Get the date of the transaction before deleting
    let date: String = conn.query_row(
        "SELECT date FROM transactions WHERE id = ?1",
        [id],
        |row| row.get(0),
    ).map_err(|e| format!("Failed to get transaction date: {}", e))?;

    // Delete the transaction
    conn.execute("DELETE FROM transactions WHERE id = ?1", [id])
        .map_err(|e| format!("Failed to delete transaction: {}", e))?;

    // Check if any transactions remain on that date
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM transactions WHERE date = ?1",
        [&date],
        |row| row.get(0),
    ).map_err(|e| format!("Failed to count remaining transactions: {}", e))?;

    // If no transactions left, remove the day
    if count == 0 {
        conn.execute("DELETE FROM days WHERE date = ?1", [&date])
            .map_err(|e| format!("Failed to delete day: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_note(app_handle: AppHandle, id: i32) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    conn.execute("DELETE FROM notes WHERE id = ?1", [id])
        .map_err(|e| format!("Failed to delete note: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_days(app_handle: AppHandle) -> Result<Vec<Day>, String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    let mut stmt = conn
        .prepare("SELECT date FROM days")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    let days = stmt
        .query_map([], |row| Ok(Day { date: row.get(0)? }))
        .map_err(|e| format!("Failed to query days: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to collect days: {}", e))?;
    println!("Returning days: {:?}", days);
    Ok(days)
}

#[tauri::command]
pub fn get_install_date(app_handle: AppHandle) -> Result<String, String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    let install_date: String = conn
        .query_row(
            "SELECT value FROM metadata WHERE key = 'install_date'",
            (),
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to query install date: {}", e))?;
    Ok(install_date)
}

#[tauri::command]
pub fn get_currency(app_handle: AppHandle) -> Result<String, String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    let currency: String = conn
        .query_row(
            "SELECT value FROM metadata WHERE key = 'currency'",
            (),
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to query currency: {}", e))?;
    Ok(currency)
}

#[tauri::command]
pub fn set_currency(app_handle: AppHandle, currency: String) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    conn.execute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?1, ?2)",
        ["currency", &currency],
    )
    .map_err(|e| format!("Failed to set currency: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_language(app_handle: AppHandle) -> Result<String, String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    let language: String = conn
        .query_row(
            "SELECT value FROM metadata WHERE key = 'language'",
            (),
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to query language: {}", e))?;
    Ok(language)
}

#[tauri::command]
pub fn set_language(app_handle: AppHandle, language: String) -> Result<(), String> {
    let db_path = get_db_path(&app_handle)?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    conn.execute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?1, ?2)",
        ["language", &language],
    )
    .map_err(|e| format!("Failed to set language: {}", e))?;
    Ok(())
}

use tauri::Builder;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            storage::init_db(app.handle().clone())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            storage::init_db,
            storage::get_transactions,
            storage::add_transaction,
            storage::update_transaction,
            storage::delete_transaction,
            storage::get_days,
            storage::get_install_date,
            storage::get_notes,
            storage::add_note,
            storage::update_note,
            storage::delete_note,
            storage::get_currency,
            storage::set_currency,
            storage::get_language,
            storage::set_language
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
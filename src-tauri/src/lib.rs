pub mod services;
pub mod commands;
pub mod models;
pub mod errors;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_log::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
        commands::get_current_user,
        commands::start_device_flow,
        commands::exchange_token,
        commands::logout,
        commands::init_repo,
        commands::stage_all,
        commands::commit_all,
        commands::add_remote,
        commands::push,
        commands::write_template_file,
        commands::get_templates,
        commands::preview_template,
        commands::create_repo,
        commands::list_repos,
        commands::check_repo_status
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

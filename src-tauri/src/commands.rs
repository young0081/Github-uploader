use tauri::{command, State};
use crate::services::{auth, github, git, templates};
use crate::models::{User, Repository, DeviceCodeResponse, OAuthTokenResponse, FileDiff};
use crate::errors::{AppError, AppResult};
use tauri::async_runtime::spawn_blocking;

// Auth
#[command]
pub async fn get_current_user() -> AppResult<User> {
    let token = spawn_blocking(|| auth::get_token()).await.map_err(|e| AppError::Unknown(e.to_string()))??;
    let client = github::GitHubClient::new(Some(token));
    client.get_user().await
}

#[command]
pub async fn start_device_flow(client_id: String) -> AppResult<DeviceCodeResponse> {
    github::GitHubClient::request_device_code(&client_id).await
}

#[command]
pub async fn exchange_token(client_id: String, device_code: String) -> AppResult<OAuthTokenResponse> {
    let res = github::GitHubClient::exchange_device_code(&client_id, &device_code).await?;
    let token = res.access_token.clone();
    spawn_blocking(move || auth::save_token(&token)).await.map_err(|e| AppError::Unknown(e.to_string()))??;
    Ok(res)
}

#[command]
pub async fn logout() -> AppResult<()> {
    spawn_blocking(|| auth::delete_token()).await.map_err(|e| AppError::Unknown(e.to_string()))??;
    Ok(())
}

// Git
#[command]
pub async fn init_repo(path: String) -> AppResult<()> {
    spawn_blocking(move || git::init_repo(&path)).await.map_err(|e| AppError::Unknown(e.to_string()))?
}

#[command]
pub async fn stage_all(path: String) -> AppResult<()> {
    spawn_blocking(move || git::stage_all(&path)).await.map_err(|e| AppError::Unknown(e.to_string()))?
}

#[command]
pub async fn commit_all(path: String, message: String) -> AppResult<()> {
    spawn_blocking(move || git::commit(&path, &message, "github-uploader", "user@example.com"))
        .await.map_err(|e| AppError::Unknown(e.to_string()))?
}

#[command]
pub async fn add_remote(path: String, url: String) -> AppResult<()> {
    spawn_blocking(move || git::add_remote(&path, "origin", &url))
        .await.map_err(|e| AppError::Unknown(e.to_string()))?
}

#[command]
pub async fn push(path: String, branch: Option<String>) -> AppResult<()> {
    let token = spawn_blocking(|| auth::get_token()).await.map_err(|e| AppError::Unknown(e.to_string()))??;
    let target_branch = branch.unwrap_or("main".to_string());
    spawn_blocking(move || git::push(&path, "origin", &target_branch, &token))
        .await.map_err(|e| AppError::Unknown(e.to_string()))?
}

// Templates
#[command]
pub async fn write_template_file(path: String, filename: String, template_name: String) -> AppResult<()> {
    let content = templates::get_template_content(&template_name);
    spawn_blocking(move || templates::write_template(&path, &filename, &content))
        .await.map_err(|e| AppError::Unknown(e.to_string()))?
}

#[command]
pub async fn get_templates() -> AppResult<Vec<String>> {
    Ok(templates::get_template_list())
}

#[command]
pub async fn preview_template(path: String, filename: String, template_name: String) -> AppResult<FileDiff> {
    spawn_blocking(move || templates::preview_template(&path, &filename, &template_name))
        .await.map_err(|e| AppError::Unknown(e.to_string()))?
}

// Repos
#[command]
pub async fn create_repo(name: String, private: bool, description: Option<String>, org: Option<String>) -> AppResult<Repository> {
    let token = spawn_blocking(|| auth::get_token()).await.map_err(|e| AppError::Unknown(e.to_string()))??;
    let client = github::GitHubClient::new(Some(token));
    client.create_repo(&name, private, description, org).await
}

#[command]
pub async fn list_repos(page: u32, query: Option<String>) -> AppResult<Vec<Repository>> {
    let token = spawn_blocking(|| auth::get_token()).await.map_err(|e| AppError::Unknown(e.to_string()))??;
    let client = github::GitHubClient::new(Some(token));
    client.list_repos(page, query).await
}

#[command]
pub async fn check_repo_status(owner: String, repo: String) -> AppResult<bool> {
    let token = spawn_blocking(|| auth::get_token()).await.map_err(|e| AppError::Unknown(e.to_string()))??;
    let client = github::GitHubClient::new(Some(token));
    client.is_repo_empty(&owner, &repo).await
}
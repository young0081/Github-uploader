use reqwest::Client;
use crate::models::{User, Repository, DeviceCodeResponse, OAuthTokenResponse};
use crate::errors::{AppError, AppResult};
use serde_json::json;

const GITHUB_API_BASE: &str = "https://api.github.com";
const USER_AGENT: &str = "github-uploader-app";

pub struct GitHubClient {
    client: Client,
    token: Option<String>,
}

impl GitHubClient {
    pub fn new(token: Option<String>) -> Self {
        Self {
            client: Client::new(),
            token,
        }
    }

    fn request(&self, method: reqwest::Method, url: &str) -> reqwest::RequestBuilder {
        let mut req = self.client.request(method, url)
            .header("User-Agent", USER_AGENT)
            .header("Accept", "application/vnd.github.v3+json");
        
        if let Some(token) = &self.token {
            req = req.header("Authorization", format!("Bearer {}", token));
        }
        req
    }

    pub async fn get_user(&self) -> AppResult<User> {
        let res = self.request(reqwest::Method::GET, &format!("{}/user", GITHUB_API_BASE))
            .send()
            .await
            .map_err(|e| AppError::GitHubApi(e.to_string()))?;
            
        if !res.status().is_success() {
            return Err(AppError::GitHubApi(format!("Get user failed: {}", res.status())));
        }
        
        res.json::<User>().await.map_err(|e| AppError::GitHubApi(e.to_string()))
    }

    // Device Flow Step 1
    pub async fn request_device_code(client_id: &str) -> AppResult<DeviceCodeResponse> {
        let client = Client::new();
        let res = client.post("https://github.com/login/device/code")
            .header("User-Agent", USER_AGENT)
            .header("Accept", "application/json")
            .form(&[("client_id", client_id), ("scope", "repo read:org")])
            .send()
            .await
            .map_err(|e| AppError::GitHubApi(e.to_string()))?;

        if !res.status().is_success() {
             return Err(AppError::GitHubApi(format!("Device code request failed: {}", res.status())));
        }

        res.json::<DeviceCodeResponse>().await.map_err(|e| AppError::GitHubApi(e.to_string()))
    }

    // Device Flow Step 2 (Exchange)
    pub async fn exchange_device_code(client_id: &str, device_code: &str) -> AppResult<OAuthTokenResponse> {
        let client = Client::new();
        let res = client.post("https://github.com/login/oauth/access_token")
            .header("User-Agent", USER_AGENT)
            .header("Accept", "application/json")
            .form(&[
                ("client_id", client_id),
                ("device_code", device_code),
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code")
            ])
            .send()
            .await
            .map_err(|e| AppError::GitHubApi(e.to_string()))?;

        let text = res.text().await.map_err(|e| AppError::GitHubApi(e.to_string()))?;
        if text.contains("error") {
             return Err(AppError::GitHubApi(text)); 
        }
        
        serde_json::from_str(&text).map_err(|e| AppError::GitHubApi(e.to_string()))
    }

    pub async fn list_repos(&self, page: u32, query: Option<String>) -> AppResult<Vec<Repository>> {
        let url = if let Some(q) = query {
             format!("{}/search/repositories?q={}+user:@me&sort=updated&per_page=100&page={}", GITHUB_API_BASE, q, page)
        } else {
             format!("{}/user/repos?sort=updated&per_page=100&page={}&type=all", GITHUB_API_BASE, page)
        };

        let res = self.request(reqwest::Method::GET, &url)
            .send()
            .await
            .map_err(|e| AppError::GitHubApi(e.to_string()))?;

         if !res.status().is_success() {
            return Err(AppError::GitHubApi(format!("List repos failed: {}", res.status())));
        }

        if url.contains("/search/") {
            #[derive(serde::Deserialize)]
            struct SearchRes { items: Vec<Repository> }
            let s: SearchRes = res.json().await.map_err(|e| AppError::GitHubApi(e.to_string()))?;
            Ok(s.items)
        } else {
            res.json::<Vec<Repository>>().await.map_err(|e| AppError::GitHubApi(e.to_string()))
        }
    }

    pub async fn create_repo(&self, name: &str, private: bool, description: Option<String>, org: Option<String>) -> AppResult<Repository> {
        let url = if let Some(o) = org {
            format!("{}/orgs/{}/repos", GITHUB_API_BASE, o)
        } else {
            format!("{}/user/repos", GITHUB_API_BASE)
        };

        let body = json!({
            "name": name,
            "private": private,
            "description": description
        });

        let res = self.request(reqwest::Method::POST, &url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::GitHubApi(e.to_string()))?;

        if !res.status().is_success() {
             let status = res.status();
             let text = res.text().await.unwrap_or_default();
             return Err(AppError::GitHubApi(format!("Create repo failed: {} - {}", status, text)));
        }

        res.json::<Repository>().await.map_err(|e| AppError::GitHubApi(e.to_string()))
    }

    pub async fn is_repo_empty(&self, owner: &str, repo: &str) -> AppResult<bool> {
        let url = format!("{}/repos/{}/{}/commits?per_page=1", GITHUB_API_BASE, owner, repo);
        let res = self.request(reqwest::Method::GET, &url)
            .send()
            .await
            .map_err(|e| AppError::GitHubApi(e.to_string()))?;

        if res.status() == 409 {
            Ok(true) // Empty
        } else if res.status().is_success() {
            Ok(false) // Not empty
        } else {
            Err(AppError::GitHubApi(format!("Check empty failed: {}", res.status())))
        }
    }
}
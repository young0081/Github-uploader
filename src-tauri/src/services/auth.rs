use keyring::Entry;
use crate::errors::{AppError, AppResult};

const SERVICE_NAME: &str = "github-uploader-app";
const USER_KEY: &str = "github_oauth_token";

pub fn save_token(token: &str) -> AppResult<()> {
    let entry = Entry::new(SERVICE_NAME, USER_KEY).map_err(|e| AppError::Keyring(e.to_string()))?;
    entry.set_password(token).map_err(|e| AppError::Keyring(e.to_string()))?;
    Ok(())
}

pub fn get_token() -> AppResult<String> {
    let entry = Entry::new(SERVICE_NAME, USER_KEY).map_err(|e| AppError::Keyring(e.to_string()))?;
    match entry.get_password() {
        Ok(t) => Ok(t),
        Err(keyring::Error::NoEntry) => Err(AppError::Auth("No token found".to_string())),
        Err(e) => Err(AppError::Keyring(e.to_string())),
    }
}

pub fn delete_token() -> AppResult<()> {
    let entry = Entry::new(SERVICE_NAME, USER_KEY).map_err(|e| AppError::Keyring(e.to_string()))?;
    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::Keyring(e.to_string())),
    }
}

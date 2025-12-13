use git2::{Repository, Signature, Cred, RemoteCallbacks, PushOptions};
use std::path::Path;
use crate::errors::{AppError, AppResult};

pub fn init_repo(path: &str) -> AppResult<()> {
    Repository::init(path).map_err(|e| AppError::Git(e.to_string()))?;
    Ok(())
}

pub fn stage_all(path: &str) -> AppResult<()> {
    let repo = Repository::open(path).map_err(|e| AppError::Git(e.to_string()))?;
    let mut index = repo.index().map_err(|e| AppError::Git(e.to_string()))?;
    
    // Add all files, respecting .gitignore
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| AppError::Git(e.to_string()))?;
        
    index.write().map_err(|e| AppError::Git(e.to_string()))?;
    Ok(())
}

pub fn commit(path: &str, message: &str, author_name: &str, author_email: &str) -> AppResult<()> {
    let repo = Repository::open(path).map_err(|e| AppError::Git(e.to_string()))?;
    let mut index = repo.index().map_err(|e| AppError::Git(e.to_string()))?;
    let tree_id = index.write_tree().map_err(|e| AppError::Git(e.to_string()))?;
    let tree = repo.find_tree(tree_id).map_err(|e| AppError::Git(e.to_string()))?;

    let sig = Signature::now(author_name, author_email).map_err(|e| AppError::Git(e.to_string()))?;

    // Check if parent exists (HEAD)
    let parent = match repo.head() {
        Ok(head) => {
            let target = head.target().ok_or(AppError::Git("Head has no target".into()))?;
            Some(repo.find_commit(target).map_err(|e| AppError::Git(e.to_string()))?)
        },
        Err(_) => None, // Initial commit
    };

    let parents = if let Some(p) = &parent { vec![p] } else { vec![] };
    
    repo.commit(
        Some("HEAD"), 
        &sig, 
        &sig, 
        message, 
        &tree, 
        &parents
    ).map_err(|e| AppError::Git(e.to_string()))?;

    Ok(())
}

pub fn add_remote(path: &str, remote_name: &str, url: &str) -> AppResult<()> {
    let repo = Repository::open(path).map_err(|e| AppError::Git(e.to_string()))?;
    
    // Check if exists
    if repo.find_remote(remote_name).is_ok() {
        repo.remote_set_url(remote_name, url).map_err(|e| AppError::Git(e.to_string()))?;
    } else {
        repo.remote(remote_name, url).map_err(|e| AppError::Git(e.to_string()))?;
    }
    Ok(())
}

pub fn push(path: &str, remote_name: &str, branch: &str, token: &str) -> AppResult<()> {
    let repo = Repository::open(path).map_err(|e| AppError::Git(e.to_string()))?;
    let mut remote = repo.find_remote(remote_name).map_err(|e| AppError::Git(e.to_string()))?;

    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(|_url, _username_from_url, _allowed_types| {
        Cred::userpass_plaintext("x-access-token", token)
    });

    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(callbacks);

    let refspec = format!("refs/heads/{}:refs/heads/{}", branch, branch); // Simple mapping
    
    remote.push(&[&refspec], Some(&mut push_opts))
        .map_err(|e| AppError::Git(e.to_string()))?;
        
    Ok(())
}

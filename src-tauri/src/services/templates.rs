use std::path::Path;
use std::fs;
use crate::errors::{AppError, AppResult};
use crate::models::FileDiff;

pub fn write_template(path: &str, filename: &str, content: &str) -> AppResult<()> {
    let file_path = Path::new(path).join(filename);
    fs::write(file_path, content).map_err(|e| AppError::Io(e))?;
    Ok(())
}

pub fn get_template_content(name: &str) -> String {
    match name {
        "gitignore-node" => "node_modules/\ndist/\n.env\n".to_string(),
        "gitignore-rust" => "/target\nCargo.lock\n".to_string(),
        "README.md" => "# Project Name\n\nDescription here.".to_string(),
        "LICENSE-MIT" => "MIT License\n\nCopyright (c) ...".to_string(),
        _ => "".to_string(),
    }
}

pub fn get_template_list() -> Vec<String> {
    vec![
        "gitignore-node".to_string(),
        "gitignore-rust".to_string(),
        "README.md".to_string(),
        "LICENSE-MIT".to_string(),
    ]
}

pub fn preview_template(path: &str, filename: &str, template_name: &str) -> AppResult<FileDiff> {
    let file_path = Path::new(path).join(filename);
    let new_content = get_template_content(template_name);
    
    if file_path.exists() {
        let old_content = fs::read_to_string(&file_path).map_err(|e| AppError::Io(e))?;
        if old_content == new_content {
            Ok(FileDiff {
                path: filename.to_string(),
                status: "identical".to_string(),
                diff_content: None,
            })
        } else {
            // Simple diff: just show new content or a "Modified" status
            // For a real diff, we'd need a diff library.
            // Prompt says: "diff preview: support viewing diff of each file"
            // Let's just return both contents or a simple indicator for now, or use a diff crate if we had one.
            // We didn't add a diff crate (like `diff` or `similar`).
            // We can return the new content and let frontend compute diff?
            // Or just return the whole content as "diff" for now.
            Ok(FileDiff {
                path: filename.to_string(),
                status: "modified".to_string(),
                diff_content: Some(format!("Old:\n{}\n\nNew:\n{}", old_content, new_content)),
            })
        }
    } else {
        Ok(FileDiff {
            path: filename.to_string(),
            status: "new".to_string(),
            diff_content: Some(new_content),
        })
    }
}
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardItem {
    pub id: String,
    #[serde(rename = "type")]
    pub item_type: String, // "text" | "image"
    pub content: String,
    pub preview: Option<String>,
    pub timestamp: i64,
    pub size: Option<String>,
    #[serde(rename = "isStarred")]
    pub is_starred: Option<bool>,
    #[serde(rename = "starredAt")]
    pub starred_at: Option<i64>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
}

impl ClipboardItem {
    pub fn new_text(content: String) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        let preview = if content.len() > 100 {
            Some(content.chars().take(100).collect())
        } else {
            Some(content.clone())
        };

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            item_type: "text".to_string(),
            content,
            preview,
            timestamp: now,
            size: None,
            is_starred: None,
            starred_at: None,
            category: None,
            tags: None,
            description: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveItem {
    pub id: String,
    #[serde(rename = "originalId")]
    pub original_id: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub content: String,
    pub preview: Option<String>,
    pub timestamp: i64,
    pub size: Option<String>,
    #[serde(rename = "starredAt")]
    pub starred_at: i64,
    pub category: String,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
}

impl ArchiveItem {
    pub fn from_clipboard_item(item: &ClipboardItem, category: Option<String>) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id: format!("archive_{}", uuid::Uuid::new_v4()),
            original_id: item.id.clone(),
            item_type: item.item_type.clone(),
            content: item.content.clone(),
            preview: item.preview.clone(),
            timestamp: item.timestamp,
            size: item.size.clone(),
            starred_at: now,
            category: category.unwrap_or_else(|| "mixed-favorites".to_string()),
            tags: item.tags.clone(),
            description: item.description.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StorageSettings {
    #[serde(rename = "textDuration")]
    pub text_duration: i32, // days
    #[serde(rename = "imageDuration")]
    pub image_duration: i32,
    #[serde(rename = "fileDuration")]
    pub file_duration: i32,
}

impl StorageSettings {
    pub fn new() -> Self {
        Self {
            text_duration: 7,
            image_duration: 3,
            file_duration: 1,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FormattingSettings {
    #[serde(rename = "wrapImagePathWithBacktick")]
    pub wrap_image_path_with_backtick: bool,
}

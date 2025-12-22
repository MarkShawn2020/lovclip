import { useCallback } from 'react'
import { EnhancedClipboardItem } from '../../types/archive-types'
import {
  VideoIcon,
  PlayIcon,
  StarFilledIcon,
} from '@radix-ui/react-icons'
import './VideoGridLayout.css'

interface VideoGridLayoutProps {
  items: EnhancedClipboardItem[]
  onItemClick: (item: EnhancedClipboardItem) => void
  onItemUnstar: (item: EnhancedClipboardItem) => void
}

export default function VideoGridLayout({ 
  items, 
  onItemClick, 
  onItemUnstar 
}: VideoGridLayoutProps) {
  
  const handleUnstar = useCallback((e: React.MouseEvent, item: EnhancedClipboardItem) => {
    e.stopPropagation()
    onItemUnstar(item)
  }, [onItemUnstar])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const getVideoFormat = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toUpperCase()
    return extension || 'VIDEO'
  }

  const getResolution = (dimensions?: { width: number; height: number }) => {
    if (!dimensions) return null
    
    const { width, height } = dimensions
    
    // Common resolution names
    if (width === 1920 && height === 1080) return '1080p'
    if (width === 1280 && height === 720) return '720p'
    if (width === 3840 && height === 2160) return '4K'
    if (width === 2560 && height === 1440) return '1440p'
    
    return `${width} × ${height}`
  }

  return (
    <div className="video-grid-layout">
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><VideoIcon className="w-8 h-8" /></div>
          <div className="empty-title">还没有视频内容</div>
          <div className="empty-description">
            复制视频文件到剪切板并收藏，它们就会出现在这里
          </div>
        </div>
      ) : (
        <div className="video-grid">
          {items.map(item => (
            <div 
              key={item.id} 
              className="video-item"
              onClick={() => onItemClick(item)}
            >
              <div className="video-thumbnail">
                {item.preview ? (
                  <img 
                    src={item.preview} 
                    alt={item.metadata?.fileName || "Video"} 
                    className="thumbnail-image"
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <div className="play-icon">
                      <PlayIcon className="w-8 h-8" />
                    </div>
                  </div>
                )}
                
                <div className="video-overlay">
                  <div className="overlay-top">
                    <div className="format-badge">
                      {getVideoFormat(item.metadata?.fileName || item.content)}
                    </div>
                    <button
                      className="unstar-btn"
                      onClick={(e) => handleUnstar(e, item)}
                      title="取消收藏"
                    >
                      <StarFilledIcon className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                  
                  <div className="overlay-bottom">
                    {item.metadata?.duration && (
                      <div className="duration-badge">
                        {formatDuration(item.metadata.duration)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="video-info">
                <div className="video-title">
                  {item.metadata?.fileName || item.content}
                </div>
                
                <div className="video-metadata">
                  <div className="video-stats">
                    {getResolution(item.metadata?.dimensions) && (
                      <span className="resolution">
                        {getResolution(item.metadata?.dimensions)}
                      </span>
                    )}
                    {item.metadata?.fileSize && (
                      <span className="file-size">
                        {getFileSize(item.metadata.fileSize)}
                      </span>
                    )}
                  </div>
                  
                  <div className="video-time">
                    {formatTimestamp(item.starredAt || item.timestamp)}
                  </div>
                </div>
                
                {item.description && (
                  <div className="video-description">
                    {item.description}
                  </div>
                )}
                
                {item.tags && item.tags.length > 0 && (
                  <div className="video-tags">
                    {item.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { useCallback } from 'react'
import { EnhancedClipboardItem } from '../../types/archive-types'
import {
  FileTextIcon,
  Link2Icon,
  StarFilledIcon,
} from '@radix-ui/react-icons'
import './TextListLayout.css'

interface TextListLayoutProps {
  items: EnhancedClipboardItem[]
  onItemClick: (item: EnhancedClipboardItem) => void
  onItemUnstar: (item: EnhancedClipboardItem) => void
}

export default function TextListLayout({ 
  items, 
  onItemClick, 
  onItemUnstar 
}: TextListLayoutProps) {
  
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

  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const getContentType = (content: string): { type: string; icon: React.ReactNode } => {
    // Detect different text content types
    try {
      JSON.parse(content)
      return { type: 'JSON', icon: <span className="font-mono text-xs">{'{}'}</span> }
    } catch {}

    if (/<[a-z][\s\S]*>/i.test(content)) {
      return { type: 'HTML', icon: <span className="font-mono text-xs">{'</>'}</span> }
    }

    if (/^#{1,6}\s/.test(content) || /\*\*.*\*\*/.test(content)) {
      return { type: 'Markdown', icon: <span className="font-mono text-xs">MD</span> }
    }

    if (content.includes('@') && content.includes('.')) {
      return { type: 'Email', icon: <span className="font-mono text-xs">@</span> }
    }

    if (/https?:\/\//.test(content)) {
      return { type: 'URL', icon: <Link2Icon className="w-4 h-4" /> }
    }

    return { type: 'Text', icon: <span className="font-mono text-xs">T</span> }
  }

  const getCharacterCount = (content: string) => {
    return `${content.length} 字符`
  }

  const getWordCount = (content: string) => {
    const words = content.trim().split(/\s+/)
    return `${words.length} 词`
  }

  return (
    <div className="text-list-layout">
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileTextIcon className="w-8 h-8" /></div>
          <div className="empty-title">还没有文本内容</div>
          <div className="empty-description">
            复制文本到剪切板并收藏，它们就会出现在这里
          </div>
        </div>
      ) : (
        <div className="text-list">
          {items.map(item => {
            const contentTypeInfo = getContentType(item.content)
            
            return (
              <div 
                key={item.id} 
                className="text-item"
                onClick={() => onItemClick(item)}
              >
                <div className="text-item-header">
                  <div className="text-type-indicator">
                    <span className="type-icon">{contentTypeInfo.icon}</span>
                    <span className="type-label">{contentTypeInfo.type}</span>
                  </div>
                  
                  <div className="text-item-actions">
                    <span className="text-time">
                      {formatTimestamp(item.starredAt || item.timestamp)}
                    </span>
                    <button
                      className="unstar-btn"
                      onClick={(e) => handleUnstar(e, item)}
                      title="取消收藏"
                    >
                      <StarFilledIcon className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
                
                <div className="text-content">
                  <div className="text-preview">
                    {getContentPreview(item.content)}
                  </div>
                  
                  {item.description && (
                    <div className="text-description">
                      {item.description}
                    </div>
                  )}
                </div>
                
                <div className="text-item-footer">
                  <div className="text-stats">
                    <span className="char-count">{getCharacterCount(item.content)}</span>
                    <span className="word-count">{getWordCount(item.content)}</span>
                  </div>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="text-tags">
                      {item.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
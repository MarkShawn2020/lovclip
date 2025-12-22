import { useState, useEffect } from 'react'
import { ContentType, CONTENT_TYPE_CONFIGS, ContentTypeDetector, EnhancedClipboardItem } from '../types/archive-types'
import { ClipboardItem } from '../types/tauri'
import './ContentTypeNavigator.css'

interface ContentTypeNavigatorProps {
  items: ClipboardItem[]
  selectedContentType: ContentType | 'all'
  onContentTypeChange: (contentType: ContentType | 'all') => void
  onItemsFiltered: (filteredItems: EnhancedClipboardItem[]) => void
}

export default function ContentTypeNavigator({ 
  items, 
  selectedContentType, 
  onContentTypeChange,
  onItemsFiltered 
}: ContentTypeNavigatorProps) {
  const [enhancedItems, setEnhancedItems] = useState<EnhancedClipboardItem[]>([])
  const [contentTypeCounts, setContentTypeCounts] = useState<Record<ContentType | 'all', number>>({
    all: 0,
    text: 0,
    image: 0,
    audio: 0,
    video: 0,
    document: 0,
    other: 0
  })

  // Convert ClipboardItem to EnhancedClipboardItem with content type detection
  useEffect(() => {
    const enhanced = items.map(item => {
      const contentType = ContentTypeDetector.detectFromContent(item.content, item.type)
      
      const enhancedItem: EnhancedClipboardItem = {
        ...item,
        contentType,
        metadata: {
          // File metadata would be populated from actual file analysis
        }
      }
      
      return enhancedItem
    })
    
    setEnhancedItems(enhanced)
    
    // Calculate content type counts
    const counts: Record<ContentType | 'all', number> = {
      all: enhanced.length,
      text: 0,
      image: 0,
      audio: 0,
      video: 0,
      document: 0,
      other: 0
    }
    
    enhanced.forEach(item => {
      counts[item.contentType]++
    })
    
    setContentTypeCounts(counts)
  }, [items])

  // Filter items by selected content type
  useEffect(() => {
    let filtered = enhancedItems
    
    if (selectedContentType !== 'all') {
      filtered = enhancedItems.filter(item => item.contentType === selectedContentType)
    }
    
    onItemsFiltered(filtered)
  }, [enhancedItems, selectedContentType, onItemsFiltered])

  // Available content types with items
  const availableContentTypes = Object.entries(contentTypeCounts)
    .filter(([type, count]) => count > 0)
    .map(([type]) => type as ContentType | 'all')

  const allContentTypeConfig = {
    id: 'all' as const,
    name: '全部',
    icon: '📚',
    layoutType: 'mixed' as const
  }

  return (
    <div className="content-type-navigator">
      <div className="content-type-tabs">
        {/* All tab */}
        <button
          className={`content-type-tab ${selectedContentType === 'all' ? 'active' : ''}`}
          onClick={() => onContentTypeChange('all')}
        >
          <span className="tab-icon">{allContentTypeConfig.icon}</span>
          <span className="tab-label">{allContentTypeConfig.name}</span>
          <span className="tab-count">{contentTypeCounts.all}</span>
        </button>
        
        {/* Individual content type tabs */}
        {(Object.keys(CONTENT_TYPE_CONFIGS) as ContentType[])
          .filter(type => contentTypeCounts[type] > 0)
          .map(contentType => {
            const config = CONTENT_TYPE_CONFIGS[contentType]
            return (
              <button
                key={contentType}
                className={`content-type-tab ${selectedContentType === contentType ? 'active' : ''}`}
                onClick={() => onContentTypeChange(contentType)}
              >
                <span className="tab-icon">{config.icon}</span>
                <span className="tab-label">{config.name}</span>
                <span className="tab-count">{contentTypeCounts[contentType]}</span>
              </button>
            )
          })}
      </div>
      
      {/* Layout type indicator */}
      <div className="layout-indicator">
        {selectedContentType === 'all' ? (
          <span className="layout-type">混合布局</span>
        ) : (
          <span className="layout-type">
            {selectedContentType === 'image' && '瀑布流布局'}
            {selectedContentType === 'text' && '列表布局'}
            {selectedContentType === 'audio' && '列表布局'}
            {selectedContentType === 'video' && '网格布局'}
            {selectedContentType === 'document' && '列表布局'}
            {selectedContentType === 'other' && '网格布局'}
          </span>
        )}
      </div>
    </div>
  )
}
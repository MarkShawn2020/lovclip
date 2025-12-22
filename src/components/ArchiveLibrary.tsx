import { useEffect, useState, useMemo } from 'react'
import { ClipboardItem } from '../types/tauri'
import { ContentType, CONTENT_TYPE_CONFIGS, ContentTypeDetector, EnhancedClipboardItem } from '../types/archive-types'
import ImageWaterfallLayout from './layouts/ImageWaterfallLayout'
import TextListLayout from './layouts/TextListLayout'
import AudioListLayout from './layouts/AudioListLayout'
import VideoGridLayout from './layouts/VideoGridLayout'

interface ArchiveLibraryProps {
  onClose?: () => void
}

export default function ArchiveLibrary({ onClose }: ArchiveLibraryProps) {
  const [starredItems, setStarredItems] = useState<ClipboardItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'all'>('all')

  useEffect(() => {
    const loadArchiveData = async () => {
      const itemsResult = await window.clipboardAPI.getStarredItems()
      if (itemsResult && itemsResult.success) {
        setStarredItems(itemsResult.items)
      }
    }
    loadArchiveData()
  }, [])

  // 转换为增强型剪贴板项目
  const enhancedItems = useMemo(() => {
    return starredItems.map(item => {
      const contentType = ContentTypeDetector.detectFromContent(item.content, item.type)
      return { ...item, contentType, metadata: {} } as EnhancedClipboardItem
    })
  }, [starredItems])

  // 统计各类型数量
  const contentTypeCounts = useMemo(() => {
    const counts: Record<ContentType | 'all', number> = {
      all: enhancedItems.length, text: 0, image: 0, audio: 0, video: 0, document: 0, other: 0
    }
    enhancedItems.forEach(item => counts[item.contentType]++)
    return counts
  }, [enhancedItems])

  // 过滤显示项目
  const displayItems = useMemo(() => {
    let items = enhancedItems
    if (selectedContentType !== 'all') {
      items = items.filter(item => item.contentType === selectedContentType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.content.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      )
    }
    return items
  }, [enhancedItems, selectedContentType, searchQuery])

  const handleItemClick = async (item: EnhancedClipboardItem) => {
    await window.clipboardAPI.setClipboardContent(item as any)
    onClose?.()
  }

  const handleItemUnstar = async (item: EnhancedClipboardItem) => {
    const result = await window.clipboardAPI.deleteItem(item.id)
    if (result.success) {
      setStarredItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  const renderContentLayout = () => {
    if (displayItems.length === 0) {
      return <EmptyState searchQuery={searchQuery} />
    }

    switch (selectedContentType) {
      case 'image':
        return <ImageWaterfallLayout items={displayItems} onItemClick={handleItemClick} onItemUnstar={handleItemUnstar} />
      case 'text':
        return <TextListLayout items={displayItems} onItemClick={handleItemClick} onItemUnstar={handleItemUnstar} />
      case 'audio':
        return <AudioListLayout items={displayItems} onItemClick={handleItemClick} onItemUnstar={handleItemUnstar} />
      case 'video':
        return <VideoGridLayout items={displayItems} onItemClick={handleItemClick} onItemUnstar={handleItemUnstar} />
      case 'document':
      case 'other':
        return <TextListLayout items={displayItems} onItemClick={handleItemClick} onItemUnstar={handleItemUnstar} />
      default:
        return (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-6 overflow-y-auto content-start h-full">
            {displayItems.map(item => (
              <ArchiveCard key={item.id} item={item} onItemClick={handleItemClick} onItemUnstar={handleItemUnstar} />
            ))}
          </div>
        )
    }
  }

  const contentTypes: (ContentType | 'all')[] = ['all', 'text', 'image', 'audio', 'video', 'document', 'other']

  return (
    <div className="w-full h-screen bg-background flex flex-col pt-7 [-webkit-app-region:drag]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-4 border-b border-border/50 [-webkit-app-region:drag]">
        {onClose && (
          <button
            className="text-primary text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-primary/10 [-webkit-app-region:no-drag]"
            onClick={onClose}
          >
            ← 返回
          </button>
        )}
        <h1 className="font-serif text-lg font-semibold text-foreground">档案库</h1>
        <div className="flex-1" />
        <div className="w-64 [-webkit-app-region:no-drag]">
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:bg-secondary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden [-webkit-app-region:no-drag]">
        {/* Sidebar */}
        <aside className="w-48 bg-secondary/20 border-r border-border/30 py-4 overflow-y-auto shrink-0">
          <nav className="px-3 space-y-1">
            {contentTypes.map(type => {
              const count = contentTypeCounts[type]
              if (type !== 'all' && count === 0) return null
              const config = type === 'all' ? { icon: '📚', name: '全部' } : CONTENT_TYPE_CONFIGS[type]
              const isActive = selectedContentType === type
              return (
                <button
                  key={type}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedContentType(type)}
                >
                  <span className="text-base">{config.icon}</span>
                  <span className="flex-1 font-medium">{config.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-primary-foreground/20' : 'bg-foreground/10'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {renderContentLayout()}
        </main>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center mb-4">
        <span className="text-3xl">⭐</span>
      </div>
      <h3 className="font-serif text-lg text-foreground mb-2">
        {searchQuery ? '没有找到匹配的内容' : '暂无收藏'}
      </h3>
      <p className="text-muted-foreground text-sm text-center max-w-[200px]">
        {searchQuery ? '尝试修改搜索条件' : '点击 ⭐ 收藏剪贴板内容'}
      </p>
    </div>
  )
}

// Archive Card Component
function ArchiveCard({
  item,
  onItemClick,
  onItemUnstar
}: {
  item: EnhancedClipboardItem
  onItemClick: (item: EnhancedClipboardItem) => void
  onItemUnstar: (item: EnhancedClipboardItem) => void
}) {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="group bg-card border border-border/50 rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-md"
      onClick={() => onItemClick(item)}
    >
      {/* Content */}
      <div className="mb-3">
        {item.type === 'image' && item.preview ? (
          <img src={item.preview} alt="" className="w-full h-32 object-cover rounded-lg" />
        ) : (
          <p className="text-sm text-foreground leading-relaxed line-clamp-4">
            {item.content.substring(0, 200)}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{formatTimestamp(item.starredAt || item.timestamp)}</span>
        <button
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary/10 transition-all"
          onClick={(e) => { e.stopPropagation(); onItemUnstar(item) }}
          title="取消收藏"
        >
          ⭐
        </button>
      </div>
    </div>
  )
}

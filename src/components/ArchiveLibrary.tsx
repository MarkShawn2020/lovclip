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
      const categoriesResult = await window.clipboardAPI.getCategories()
      if (categoriesResult && categoriesResult.success) {
        setCategories(categoriesResult.categories)
      }

      const itemsResult = await window.clipboardAPI.getStarredItems()
      if (itemsResult && itemsResult.success) {
        setStarredItems(itemsResult.items)
      }
    }

    loadArchiveData()
  }, [])

  const handleItemsFiltered = useCallback((items: EnhancedClipboardItem[]) => {
    setFilteredItems(items)
  }, [])

  useEffect(() => {
    let filtered = filteredItems

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setDisplayItems(filtered)
  }, [filteredItems, selectedCategory, searchQuery])

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
    if (showLegacyView) {
      return renderLegacyLayout()
    }

    if (displayItems.length === 0) {
      return <EmptyState searchQuery={searchQuery} />
    }

    const contentTypeItems = selectedContentType === 'all'
      ? displayItems
      : displayItems.filter(item => item.contentType === selectedContentType)

    switch (selectedContentType) {
      case 'image':
        return (
          <ImageWaterfallLayout
            items={contentTypeItems}
            onItemClick={handleItemClick}
            onItemUnstar={handleItemUnstar}
          />
        )
      case 'text':
        return (
          <TextListLayout
            items={contentTypeItems}
            onItemClick={handleItemClick}
            onItemUnstar={handleItemUnstar}
          />
        )
      case 'audio':
        return (
          <AudioListLayout
            items={contentTypeItems}
            onItemClick={handleItemClick}
            onItemUnstar={handleItemUnstar}
          />
        )
      case 'video':
        return (
          <VideoGridLayout
            items={contentTypeItems}
            onItemClick={handleItemClick}
            onItemUnstar={handleItemUnstar}
          />
        )
      case 'document':
      case 'other':
        return (
          <TextListLayout
            items={contentTypeItems}
            onItemClick={handleItemClick}
            onItemUnstar={handleItemUnstar}
          />
        )
      case 'all':
      default:
        return renderLegacyLayout()
    }
  }

  const renderLegacyLayout = () => {
    if (displayItems.length === 0) {
      return <EmptyState searchQuery={searchQuery} />
    }

    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 p-5 overflow-y-auto content-start h-full">
        {displayItems.map(item => (
          <ArchiveCard
            key={item.id}
            item={item}
            onItemClick={handleItemClick}
            onItemUnstar={handleItemUnstar}
          />
        ))}
      </div>
    )
  }

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'text': return '📄'
      case 'image': return '🖼️'
      case 'file': return '📁'
      default: return '📚'
    }
  }

  return (
    <div className="w-full h-screen bg-background/95 backdrop-blur-3xl flex flex-col pt-7 [-webkit-app-region:drag]">
      {/* Header */}
      <header className="bg-secondary/40 px-6 py-4 flex justify-between items-center [-webkit-app-region:drag]">
        <div className="flex items-center gap-4 flex-1">
          {onClose && (
            <button
              className="text-primary text-sm px-3 py-1.5 rounded-xl transition-colors hover:bg-primary/10 [-webkit-app-region:no-drag]"
              onClick={onClose}
            >
              ← 返回
            </button>
          )}
          <h1 className="font-serif text-xl font-semibold text-foreground flex items-center gap-2.5">
            <span className="text-2xl">📚</span>
            我的档案库
          </h1>

          {/* View Toggle */}
          <div className="flex gap-1 bg-primary/5 rounded-xl p-1 ml-4 [-webkit-app-region:no-drag]">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${!showLegacyView ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-primary/10'}`}
              onClick={() => setShowLegacyView(false)}
              title="增强视图"
            >
              🎨
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${showLegacyView ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-primary/10'}`}
              onClick={() => setShowLegacyView(true)}
              title="经典视图"
            >
              📋
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md ml-8 [-webkit-app-region:no-drag]">
          <input
            type="text"
            placeholder="搜索档案库..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-background/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </header>

      {/* Content Type Navigator */}
      {!showLegacyView && (
        <ContentTypeNavigator
          items={starredItems}
          selectedContentType={selectedContentType}
          onContentTypeChange={setSelectedContentType}
          onItemsFiltered={handleItemsFiltered}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden [-webkit-app-region:no-drag]">
        {/* Sidebar */}
        <aside className={`${showLegacyView ? 'w-60' : 'w-52'} bg-secondary/30 py-5 overflow-y-auto shrink-0`}>
          <nav className="px-3 space-y-1">
            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground hover:bg-primary/5'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="text-base">🗂️</span>
              <span className="flex-1 text-sm font-medium">全部收藏</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === 'all' ? 'bg-primary/20' : 'bg-foreground/10'
              }`}>
                {starredItems.length}
              </span>
            </button>

            {categories.map(category => (
              <button
                key={category.id}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground hover:bg-primary/5'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="text-base">{getCategoryIcon(category.type)}</span>
                <span className="flex-1 text-sm font-medium truncate">{category.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === category.id ? 'bg-primary/20' : 'bg-foreground/10'
                }`}>
                  {category.itemCount}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden bg-transparent">
          {renderContentLayout()}
        </main>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mb-6 shadow-sm">
        <span className="text-5xl opacity-60">⭐</span>
      </div>
      <h3 className="font-serif text-xl text-foreground mb-3">
        {searchQuery ? '没有找到匹配的内容' : '还没有收藏任何内容'}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs text-center leading-relaxed">
        {searchQuery ? '尝试修改搜索条件' : '在主界面中点击 ⭐ 按钮来收藏重要的剪切板内容'}
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
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️'
      case 'file': return '📁'
      default: return '📄'
    }
  }

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
      className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      onClick={() => onItemClick(item)}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-lg">{getItemIcon(item.type)}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {formatTimestamp(item.starredAt || item.timestamp)}
          </span>
          <button
            className="opacity-0 group-hover:opacity-100 text-sm p-1.5 rounded-lg transition-all hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation()
              onItemUnstar(item)
            }}
            title="取消收藏"
          >
            ⭐
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        {item.type === 'image' && item.preview ? (
          <img
            src={item.preview}
            alt="Preview"
            className="w-full h-28 object-cover rounded-lg"
          />
        ) : (
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">
            {item.content.substring(0, 200)}
            {item.content.length > 200 && '...'}
          </p>
        )}
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-muted-foreground italic bg-secondary/50 px-2.5 py-1.5 rounded-lg mb-2 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map(tag => (
            <span
              key={tag}
              className="text-xs bg-primary/10 text-foreground px-2 py-0.5 rounded-md font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom, settingsWindowPositionAtom } from '../store/atoms'
import './SettingsWindow.css'

interface StorageSettings {
  textDuration: number
  imageDuration: number
  fileDuration: number
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  autoStart: boolean
  showNotifications: boolean
  hotkey: string
  maxHistoryItems: number
  autoCleanup: boolean
  storage: StorageSettings
}

export default function SettingsWindow() {
  const [settings, setSettings] = useAtom(settingsAtom)
  const [windowPosition, setWindowPosition] = useAtom(settingsWindowPositionAtom)
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [activeSection, setActiveSection] = useState('general')
  const [isCapturingShortcut, setIsCapturingShortcut] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storageSettings, currentShortcut] = await Promise.all([
          window.clipboardAPI.getStorageSettings(),
          window.windowAPI.getCurrentShortcut()
        ])
        
        setLocalSettings(prev => ({
          ...prev,
          storage: storageSettings,
          hotkey: currentShortcut
        }))
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load settings:', error)
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // 初始化窗口位置
  useEffect(() => {
    const initWindowPosition = async () => {
      try {
        const bounds = await window.windowAPI.getSettingsBounds()
        setWindowPosition(bounds)
      } catch (error) {
        console.error('Failed to load settings window position:', error)
      }
    }
    
    initWindowPosition()
    
    // 监听窗口位置变化
    window.windowAPI.onSettingsBoundsChanged((bounds) => {
      setWindowPosition(bounds)
    })
    
    return () => {
      window.windowAPI.removeSettingsWindowListener()
    }
  }, [setWindowPosition])

  // 响应主进程请求保存的窗口位置 (Tauri version - using events)
  useEffect(() => {
    // In Tauri, window state is handled by the window-state plugin automatically
    // No manual IPC needed
  }, [windowPosition])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // 保存存储设置
      await window.clipboardAPI.setStorageSettings(localSettings.storage)
      
      // 保存应用设置（快捷键已经实时更新，这里只需要同步状态）
      setSettings(localSettings)
      
      setSavedMessage('设置已保存')
      setTimeout(() => setSavedMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSavedMessage('保存失败')
      setTimeout(() => setSavedMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStorageChange = (key: keyof StorageSettings, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      storage: {
        ...prev.storage,
        [key]: value
      }
    }))
  }

  const handleSettingChange = async (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // 如果是快捷键更改，立即应用
    if (key === 'hotkey') {
      try {
        const result = await window.windowAPI.updateGlobalShortcut(value)
        if (result.success) {
          // 同时更新全局设置
          setSettings(prev => ({
            ...prev,
            [key]: value
          }))
        } else {
          // 如果失败，显示错误信息但不阻止界面更新
          setSavedMessage(`快捷键更新失败: ${result.error}`)
          setTimeout(() => setSavedMessage(''), 3000)
        }
      } catch (error) {
        console.error('快捷键更新出错:', error)
      }
    }
  }

  const handleResetSettings = () => {
    if (confirm('确定要恢复默认设置吗？此操作不可撤销。')) {
      const defaultSettings: AppSettings = {
        theme: 'auto',
        autoStart: false,
        showNotifications: true,
        hotkey: 'CommandOrControl+Shift+C',
        maxHistoryItems: 1000,
        autoCleanup: true,
        storage: {
          textDuration: 7,
          imageDuration: 3,
          fileDuration: 1
        }
      }
      setLocalSettings(defaultSettings)
    }
  }

  // 将Electron快捷键格式转换为苹果符号格式
  const formatShortcutForDisplay = (shortcut: string) => {
    return shortcut
      .replace(/CommandOrControl/g, '⌘')
      .replace(/Command/g, '⌘')
      .replace(/Ctrl/g, '⌘')
      .replace(/Control/g, '⌘')
      .replace(/Shift/g, '⇧')
      .replace(/Alt/g, '⌥')
      .replace(/Option/g, '⌥')
      .replace(/Meta/g, '⌘')
      .replace(/\+/g, '')
  }

  // 处理快捷键捕获
  const handleShortcutCapture = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCapturingShortcut) return
    
    e.preventDefault()
    e.stopPropagation()

    // 如果只是修饰键，不完成输入
    if (['Control', 'Meta', 'Shift', 'Alt', 'Command'].includes(e.key)) {
      return
    }

    const keys = []
    
    // 修饰键 - 按照 Electron 官方推荐顺序
    if (e.ctrlKey || e.metaKey) {
      keys.push('CommandOrControl')
    }
    if (e.shiftKey) {
      keys.push('Shift')
    }
    if (e.altKey) {
      keys.push('Alt')
    }
    
    // 主键
    if (e.key) {
      let key = e.key.toLowerCase()
      
      // 特殊键映射
      const keyMap: { [key: string]: string } = {
        ' ': 'Space',
        'escape': 'Escape',
        'enter': 'Return',
        'tab': 'Tab',
        'backspace': 'Backspace',
        'delete': 'Delete',
        'arrowup': 'Up',
        'arrowdown': 'Down',
        'arrowleft': 'Left',
        'arrowright': 'Right',
        'home': 'Home',
        'end': 'End',
        'pageup': 'PageUp',
        'pagedown': 'PageDown'
      }
      
      key = keyMap[key] || key.toUpperCase()
      keys.push(key)
    }
    
    // 需要至少一个修饰键和一个主键
    if (keys.length >= 2) {
      const shortcut = keys.join('+')
      handleSettingChange('hotkey', shortcut)
      setIsCapturingShortcut(false)
    }
  }

  const handleShortcutInputClick = () => {
    setIsCapturingShortcut(true)
  }

  const handleShortcutInputBlur = () => {
    setIsCapturingShortcut(false)
  }

  if (isLoading) {
    return (
      <div className="settings-window loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div className="loading-text">加载设置中...</div>
        </div>
      </div>
    )
  }

  // 侧边栏菜单项
  const sidebarItems = [
    { id: 'general', name: '通用', icon: '⚙️' },
    { id: 'appearance', name: '外观', icon: '🎨' },
    { id: 'shortcuts', name: '快捷键', icon: '⌨️' },
    { id: 'storage', name: '存储', icon: '💾' },
    { id: 'data', name: '数据管理', icon: '🗂️' }
  ]

  // 渲染当前选中的设置面板
  const renderSettingsPanel = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="settings-panel">
            <div className="panel-header">
              <h2>通用</h2>
              <p>应用行为和基本设置</p>
            </div>
            <div className="panel-content">
              <div className="setting-row">
                <div className="setting-info">
                  <label>开机自启动</label>
                  <p>系统启动时自动运行 LovPen</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="checkbox" 
                    checked={localSettings.autoStart}
                    onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
                  />
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <label>显示通知</label>
                  <p>显示系统通知提醒</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="checkbox" 
                    checked={localSettings.showNotifications}
                    onChange={(e) => handleSettingChange('showNotifications', e.target.checked)}
                  />
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <label>自动清理过期项目</label>
                  <p>自动删除过期的剪切板项目</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="checkbox" 
                    checked={localSettings.autoCleanup}
                    onChange={(e) => handleSettingChange('autoCleanup', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 'appearance':
        return (
          <div className="settings-panel">
            <div className="panel-header">
              <h2>外观</h2>
              <p>主题和界面设置</p>
            </div>
            <div className="panel-content">
              <div className="setting-row">
                <div className="setting-info">
                  <label>主题</label>
                  <p>选择应用的外观主题</p>
                </div>
                <div className="setting-control">
                  <select 
                    value={localSettings.theme} 
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                  >
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                    <option value="auto">跟随系统</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
      case 'shortcuts':
        return (
          <div className="settings-panel">
            <div className="panel-header">
              <h2>快捷键</h2>
              <p>自定义键盘快捷键</p>
            </div>
            <div className="panel-content">
              <div className="setting-row">
                <div className="setting-info">
                  <label>全局快捷键</label>
                  <p>用于显示/隐藏 LovPen 窗口的快捷键</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="text" 
                    value={isCapturingShortcut ? '按下快捷键组合...' : formatShortcutForDisplay(localSettings.hotkey)}
                    onChange={() => {}} // 只读，通过键盘事件更新
                    onKeyDown={handleShortcutCapture}
                    onClick={handleShortcutInputClick}
                    onBlur={handleShortcutInputBlur}
                    placeholder="点击并按下快捷键组合"
                    readOnly
                    className={`shortcut-input ${isCapturingShortcut ? 'capturing' : ''}`}
                  />
                  <div style={{ fontSize: '12px', color: '#86868b', marginTop: '8px' }}>
                    推荐快捷键：⌘⇧\` • ⌘⌥\` • ⌘⇧F12 • ⌘⌥F11
                  </div>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <label>备用快捷键</label>
                  <p>固定的备用快捷键 (Cmd/Ctrl + Option + C)</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="text" 
                    value={formatShortcutForDisplay("CommandOrControl+Alt+C")}
                    readOnly
                    className="shortcut-input readonly"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 'storage':
        return (
          <div className="settings-panel">
            <div className="panel-header">
              <h2>存储</h2>
              <p>数据存储和保留设置</p>
            </div>
            <div className="panel-content">
              <div className="setting-row">
                <div className="setting-info">
                  <label>最大历史记录数</label>
                  <p>保存的最大剪切板项目数量</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="number" 
                    value={localSettings.maxHistoryItems}
                    onChange={(e) => handleSettingChange('maxHistoryItems', parseInt(e.target.value))}
                    min="100"
                    max="10000"
                  />
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <label>文本保存时间</label>
                  <p>文本项目的保存时间（天）</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="number" 
                    value={localSettings.storage.textDuration}
                    onChange={(e) => handleStorageChange('textDuration', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <label>图片保存时间</label>
                  <p>图片项目的保存时间（天）</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="number" 
                    value={localSettings.storage.imageDuration}
                    onChange={(e) => handleStorageChange('imageDuration', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <label>文件保存时间</label>
                  <p>文件项目的保存时间（天）</p>
                </div>
                <div className="setting-control">
                  <input 
                    type="number" 
                    value={localSettings.storage.fileDuration}
                    onChange={(e) => handleStorageChange('fileDuration', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 'data':
        return (
          <div className="settings-panel">
            <div className="panel-header">
              <h2>数据管理</h2>
              <p>管理和清理应用数据</p>
            </div>
            <div className="panel-content">
              <div className="setting-row">
                <div className="setting-info">
                  <label>清理过期项目</label>
                  <p>删除超过保存时间的项目</p>
                </div>
                <div className="setting-control">
                  <button 
                    className="btn btn-secondary"
                    onClick={async () => {
                      try {
                        await window.clipboardAPI.cleanupExpiredItems()
                        setSavedMessage('过期项目已清理')
                        setTimeout(() => setSavedMessage(''), 3000)
                      } catch (error) {
                        console.error('Failed to cleanup expired items:', error)
                        setSavedMessage('清理失败')
                        setTimeout(() => setSavedMessage(''), 3000)
                      }
                    }}
                  >
                    立即清理
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <label>清空历史记录</label>
                  <p>删除所有剪切板历史记录</p>
                </div>
                <div className="setting-control">
                  <button 
                    className="btn btn-danger"
                    onClick={async () => {
                      if (confirm('确定要清空所有剪切板历史记录吗？此操作不可撤销。')) {
                        try {
                          await window.clipboardAPI.clearHistory()
                          setSavedMessage('历史记录已清空')
                          setTimeout(() => setSavedMessage(''), 3000)
                        } catch (error) {
                          console.error('Failed to clear history:', error)
                          setSavedMessage('清空失败')
                          setTimeout(() => setSavedMessage(''), 3000)
                        }
                      }
                    }}
                  >
                    清空记录
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="settings-window">
      <div className="settings-header">
        <h1>LovPen 设置</h1>
      </div>

      <div className="settings-body">
        <div className="settings-sidebar">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {renderSettingsPanel()}
        </div>
      </div>

      <div className="settings-footer">
        <div className="footer-message">
          {savedMessage && <span className="saved-message">{savedMessage}</span>}
        </div>
        <div className="footer-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleResetSettings}
            disabled={isSaving}
          >
            恢复默认
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
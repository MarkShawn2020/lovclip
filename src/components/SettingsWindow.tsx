import { useEffect, useState, ComponentType } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom, settingsWindowPositionAtom } from '../store/atoms'
import {
  GearIcon,
  MixerHorizontalIcon,
  KeyboardIcon,
  DownloadIcon,
  StackIcon,
  CodeIcon,
} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface StorageSettings {
  textDuration: number
  imageDuration: number
  fileDuration: number
}

interface FormattingSettings {
  wrapImagePathWithBacktick: boolean
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  autoStart: boolean
  showNotifications: boolean
  hotkey: string
  maxHistoryItems: number
  autoCleanup: boolean
  storage: StorageSettings
  formatting: FormattingSettings
}

interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border/60 last:border-b-0">
      <div className="flex-1 min-w-0">
        <Label className="text-[15px] font-medium text-foreground">{label}</Label>
        {description && (
          <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  )
}

interface PanelProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <div className="max-w-2xl p-8">
      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground font-serif">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function SettingsWindow() {
  const [settings, setSettings] = useAtom(settingsAtom)
  const [, setWindowPosition] = useAtom(settingsWindowPositionAtom)
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
          window.windowAPI.getCurrentShortcut(),
        ])

        setLocalSettings(prev => ({
          ...prev,
          storage: storageSettings,
          hotkey: currentShortcut,
        }))
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load settings:', error)
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

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

    window.windowAPI.onSettingsBoundsChanged((bounds) => {
      setWindowPosition(bounds)
    })

    return () => {
      window.windowAPI.removeSettingsWindowListener()
    }
  }, [setWindowPosition])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await window.clipboardAPI.setStorageSettings(localSettings.storage)
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
      storage: { ...prev.storage, [key]: value },
    }))
  }

  const handleFormattingChange = (key: keyof FormattingSettings, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      formatting: { ...(prev.formatting ?? { wrapImagePathWithBacktick: false }), [key]: value },
    }))
  }

  const handleSettingChange = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))

    if (key === 'hotkey') {
      try {
        const result = await window.windowAPI.updateGlobalShortcut(value as string)
        if (result.success) {
          setSettings(prev => ({ ...prev, [key]: value }))
        } else {
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
      setLocalSettings({
        theme: 'auto',
        autoStart: false,
        showNotifications: true,
        hotkey: 'CommandOrControl+Shift+C',
        maxHistoryItems: 1000,
        autoCleanup: true,
        storage: { textDuration: 7, imageDuration: 3, fileDuration: 1 },
        formatting: { wrapImagePathWithBacktick: false },
      })
    }
  }

  const formatShortcutForDisplay = (shortcut: string) =>
    shortcut
      .replace(/CommandOrControl/g, '⌘')
      .replace(/Command/g, '⌘')
      .replace(/Ctrl/g, '⌘')
      .replace(/Control/g, '⌘')
      .replace(/Shift/g, '⇧')
      .replace(/Alt/g, '⌥')
      .replace(/Option/g, '⌥')
      .replace(/Meta/g, '⌘')
      .replace(/\+/g, '')

  const handleShortcutCapture = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCapturingShortcut) return

    e.preventDefault()
    e.stopPropagation()

    if (['Control', 'Meta', 'Shift', 'Alt', 'Command'].includes(e.key)) return

    const keys: string[] = []
    if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
    if (e.shiftKey) keys.push('Shift')
    if (e.altKey) keys.push('Alt')

    if (e.key) {
      let key = e.key.toLowerCase()
      const keyMap: { [k: string]: string } = {
        ' ': 'Space',
        escape: 'Escape',
        enter: 'Return',
        tab: 'Tab',
        backspace: 'Backspace',
        delete: 'Delete',
        arrowup: 'Up',
        arrowdown: 'Down',
        arrowleft: 'Left',
        arrowright: 'Right',
        home: 'Home',
        end: 'End',
        pageup: 'PageUp',
        pagedown: 'PageDown',
      }
      key = keyMap[key] || key.toUpperCase()
      keys.push(key)
    }

    if (keys.length >= 2) {
      handleSettingChange('hotkey', keys.join('+'))
      setIsCapturingShortcut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-primary/10 border-t-primary animate-spin" />
          <div className="text-sm text-muted-foreground">加载设置中...</div>
        </div>
      </div>
    )
  }

  const sidebarItems: { id: string; name: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'general', name: '通用', icon: GearIcon },
    { id: 'appearance', name: '外观', icon: MixerHorizontalIcon },
    { id: 'shortcuts', name: '快捷键', icon: KeyboardIcon },
    { id: 'formatting', name: '格式化', icon: CodeIcon },
    { id: 'storage', name: '存储', icon: DownloadIcon },
    { id: 'data', name: '数据管理', icon: StackIcon },
  ]

  const renderSettingsPanel = () => {
    switch (activeSection) {
      case 'general':
        return (
          <Panel title="通用" subtitle="应用行为和基本设置">
            <SettingRow label="开机自启动" description="系统启动时自动运行 Lovclip">
              <Switch
                checked={localSettings.autoStart}
                onCheckedChange={(v) => handleSettingChange('autoStart', v)}
              />
            </SettingRow>
            <SettingRow label="显示通知" description="显示系统通知提醒">
              <Switch
                checked={localSettings.showNotifications}
                onCheckedChange={(v) => handleSettingChange('showNotifications', v)}
              />
            </SettingRow>
            <SettingRow label="自动清理过期项目" description="自动删除过期的剪切板项目">
              <Switch
                checked={localSettings.autoCleanup}
                onCheckedChange={(v) => handleSettingChange('autoCleanup', v)}
              />
            </SettingRow>
          </Panel>
        )

      case 'appearance':
        return (
          <Panel title="外观" subtitle="主题和界面设置">
            <SettingRow label="主题" description="选择应用的外观主题">
              <Select
                value={localSettings.theme}
                onValueChange={(v) => handleSettingChange('theme', v as AppSettings['theme'])}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色</SelectItem>
                  <SelectItem value="dark">深色</SelectItem>
                  <SelectItem value="auto">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </Panel>
        )

      case 'shortcuts':
        return (
          <Panel title="快捷键" subtitle="自定义键盘快捷键">
            <SettingRow label="全局快捷键" description="用于显示/隐藏 Lovclip 窗口的快捷键">
              <Input
                className={cn(
                  'w-52 text-center font-medium cursor-pointer',
                  isCapturingShortcut && 'bg-primary text-primary-foreground border-primary animate-pulse'
                )}
                value={isCapturingShortcut ? '按下快捷键组合...' : formatShortcutForDisplay(localSettings.hotkey)}
                onChange={() => {}}
                onKeyDown={handleShortcutCapture}
                onClick={() => setIsCapturingShortcut(true)}
                onBlur={() => setIsCapturingShortcut(false)}
                placeholder="点击并按下快捷键组合"
                readOnly
              />
            </SettingRow>
            <SettingRow label="备用快捷键" description="固定的备用快捷键（⌘⌥C）">
              <Input
                className="w-52 text-center font-medium bg-muted text-muted-foreground cursor-default"
                value={formatShortcutForDisplay('CommandOrControl+Alt+C')}
                readOnly
              />
            </SettingRow>
          </Panel>
        )

      case 'formatting':
        return (
          <Panel title="格式化" subtitle="复制/粘贴时的内容格式化规则">
            <SettingRow
              label="图片路径自动反引号包围"
              description="复制图片路径时自动用反引号包围（防止在 Claude Code 等工具中粘贴时被解析为图片）"
            >
              <Switch
                checked={localSettings.formatting?.wrapImagePathWithBacktick ?? false}
                onCheckedChange={(v) => handleFormattingChange('wrapImagePathWithBacktick', v)}
              />
            </SettingRow>
          </Panel>
        )

      case 'storage':
        return (
          <Panel title="存储" subtitle="数据存储和保留设置">
            <SettingRow label="最大历史记录数" description="保存的最大剪切板项目数量">
              <Input
                type="number"
                className="w-28"
                value={localSettings.maxHistoryItems}
                onChange={(e) => handleSettingChange('maxHistoryItems', parseInt(e.target.value))}
                min={100}
                max={10000}
              />
            </SettingRow>
            <SettingRow label="文本保存时间" description="文本项目的保存时间（天）">
              <Input
                type="number"
                className="w-28"
                value={localSettings.storage.textDuration}
                onChange={(e) => handleStorageChange('textDuration', parseInt(e.target.value))}
                min={1}
                max={365}
              />
            </SettingRow>
            <SettingRow label="图片保存时间" description="图片项目的保存时间（天）">
              <Input
                type="number"
                className="w-28"
                value={localSettings.storage.imageDuration}
                onChange={(e) => handleStorageChange('imageDuration', parseInt(e.target.value))}
                min={1}
                max={365}
              />
            </SettingRow>
            <SettingRow label="文件保存时间" description="文件项目的保存时间（天）">
              <Input
                type="number"
                className="w-28"
                value={localSettings.storage.fileDuration}
                onChange={(e) => handleStorageChange('fileDuration', parseInt(e.target.value))}
                min={1}
                max={365}
              />
            </SettingRow>
          </Panel>
        )

      case 'data':
        return (
          <Panel title="数据管理" subtitle="管理和清理应用数据">
            <SettingRow label="清理过期项目" description="删除超过保存时间的项目">
              <Button
                variant="secondary"
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
              </Button>
            </SettingRow>
            <SettingRow label="清空历史记录" description="删除所有剪切板历史记录">
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm('确定要清空所有剪切板历史记录吗？此操作不可撤销。')) return
                  try {
                    await window.clipboardAPI.clearHistory()
                    setSavedMessage('历史记录已清空')
                    setTimeout(() => setSavedMessage(''), 3000)
                  } catch (error) {
                    console.error('Failed to clear history:', error)
                    setSavedMessage('清空失败')
                    setTimeout(() => setSavedMessage(''), 3000)
                  }
                }}
              >
                清空记录
              </Button>
            </SettingRow>
          </Panel>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground pt-7">
      <div className="flex-1 flex min-h-0">
        <aside className="w-52 shrink-0 bg-sidebar border-r border-sidebar-border px-2 py-3 overflow-y-auto">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-md text-left text-sm transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span className="font-medium">{item.name}</span>
              </button>
            )
          })}
        </aside>

        <main className="flex-1 overflow-y-auto bg-background">{renderSettingsPanel()}</main>
      </div>

      <Separator />

      <footer className="shrink-0 flex items-center justify-between px-6 py-3 bg-secondary/50">
        <div className="flex-1">
          {savedMessage && <span className="text-sm font-medium text-primary">{savedMessage}</span>}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleResetSettings} disabled={isSaving}>
            恢复默认
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

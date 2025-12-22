import { useState, useEffect } from 'react'
import './PermissionDialog.css'

interface PermissionDialogProps {
  isOpen: boolean
  onClose: () => void
  onPermissionGranted: () => void
}

export default function PermissionDialog({ isOpen, onClose, onPermissionGranted }: PermissionDialogProps) {
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'requesting'>('checking')
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (isOpen) {
      checkPermission()
    }
  }, [isOpen])

  const checkPermission = async () => {
    try {
      const hasPermission = await window.accessibilityAPI.checkPermission()
      setPermissionStatus(hasPermission ? 'granted' : 'denied')
      if (hasPermission) {
        onPermissionGranted()
        onClose()
      }
    } catch (error) {
      console.error('Error checking permission:', error)
      setPermissionStatus('denied')
    }
  }

  const requestPermission = async () => {
    try {
      setPermissionStatus('requesting')
      const granted = await window.accessibilityAPI.requestPermission()
      
      if (granted) {
        setPermissionStatus('granted')
        onPermissionGranted()
        onClose()
      } else {
        setPermissionStatus('denied')
        setShowInstructions(true)
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      setPermissionStatus('denied')
      setShowInstructions(true)
    }
  }

  const openSystemPreferences = async () => {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility')
  }

  if (!isOpen) return null

  return (
    <div className="permission-dialog-overlay">
      <div className="permission-dialog">
        <div className="permission-dialog-header">
          <h2>启用增强功能</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="permission-dialog-content">
          {permissionStatus === 'checking' && (
            <div className="permission-status">
              <div className="loading-spinner"></div>
              <p>正在检查权限状态...</p>
            </div>
          )}
          
          {permissionStatus === 'denied' && !showInstructions && (
            <div className="permission-request">
              <div className="permission-icon">🔒</div>
              <h3>需要辅助功能权限</h3>
              <p>为了实现 Alfred 风格的直接文本插入功能，LovPen 需要访问辅助功能权限。</p>
              <p>这将允许 LovPen 直接将文本插入到其他应用程序的输入框中，而不需要手动粘贴。</p>
              
              <div className="permission-features">
                <h4>启用后您将获得：</h4>
                <ul>
                  <li>✨ 直接文本插入 - 无需手动粘贴</li>
                  <li>🎯 智能焦点检测 - 自动识别输入框</li>
                  <li>⚡ 更流畅的用户体验</li>
                  <li>🔄 与 Alfred 相同的交互方式</li>
                </ul>
              </div>
              
              <div className="permission-actions">
                <button className="request-button" onClick={requestPermission}>
                  请求权限
                </button>
                <button className="skip-button" onClick={onClose}>
                  稍后设置
                </button>
              </div>
            </div>
          )}
          
          {permissionStatus === 'requesting' && (
            <div className="permission-status">
              <div className="loading-spinner"></div>
              <p>正在请求权限...</p>
              <p className="permission-note">请在系统对话框中选择"打开系统偏好设置"</p>
            </div>
          )}
          
          {showInstructions && (
            <div className="permission-instructions">
              <div className="instruction-icon">⚙️</div>
              <h3>手动设置权限</h3>
              <p>请按照以下步骤手动启用辅助功能权限：</p>
              
              <ol className="instruction-steps">
                <li>
                  <strong>打开系统偏好设置</strong>
                  <button className="open-settings-button" onClick={openSystemPreferences}>
                    打开系统偏好设置
                  </button>
                </li>
                <li>点击 <strong>"安全性与隐私"</strong></li>
                <li>选择左侧的 <strong>"辅助功能"</strong></li>
                <li>点击左下角的 <strong>"锁"</strong> 图标并输入密码</li>
                <li>在右侧列表中找到 <strong>"LovPen"</strong> 并勾选</li>
                <li>重启 LovPen 以生效</li>
              </ol>
              
              <div className="instruction-actions">
                <button className="recheck-button" onClick={checkPermission}>
                  重新检查
                </button>
                <button className="close-button-secondary" onClick={onClose}>
                  关闭
                </button>
              </div>
            </div>
          )}
          
          {permissionStatus === 'granted' && (
            <div className="permission-success">
              <div className="success-icon">✅</div>
              <h3>权限已授予！</h3>
              <p>LovPen 现在可以直接将文本插入到其他应用程序中。</p>
              <p>享受 Alfred 风格的无缝体验吧！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
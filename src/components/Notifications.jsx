import React from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import useStore from '../store'

console.log('🎯 Loading Notifications component...')

const Notifications = () => {
  const { notifications, actions } = useStore()

  console.log('🎯 Notifications render - count:', notifications.length)

  if (notifications.length === 0) {
    return null
  }

  const getNotificationStyle = (type) => {
    const styles = {
      success: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        icon: CheckCircle,
        iconColor: 'text-green-400'
      },
      error: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: AlertCircle,
        iconColor: 'text-red-400'
      },
      warning: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        icon: AlertTriangle,
        iconColor: 'text-yellow-400'
      },
      info: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: Info,
        iconColor: 'text-blue-400'
      }
    }
    return styles[type] || styles.info
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => {
        const style = getNotificationStyle(notification.type)
        const Icon = style.icon

        return (
          <div
            key={notification.id}
            className={`${style.bg} border ${style.text} rounded-lg p-4 shadow-lg animate-in slide-in-from-right-full duration-300`}
          >
            <div className="flex items-start space-x-3">
              <Icon size={20} className={`${style.iconColor} mt-0.5 flex-shrink-0`} />
              
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {notification.message}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>

              <button
                onClick={() => {
                  console.log('❌ Dismissing notification:', notification.id)
                  actions.removeNotification(notification.id)
                }}
                className={`${style.iconColor} hover:opacity-75 transition-opacity flex-shrink-0`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Notifications
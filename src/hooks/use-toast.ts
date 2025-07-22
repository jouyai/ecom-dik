"use client"

import * as React from "react"

import type {
  ToastActionElement as NotificationActionElement,
  ToastProps as NotificationComponentProps,
} from "@/components/ui/toast"

const NOTIFICATION_LIMIT = 3
const NOTIFICATION_REMOVE_DELAY = 8000

export type NotificationVariant = "success" | "info" | "warning" | "error"

type ToasterNotification = Omit<NotificationComponentProps, "variant"> & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: NotificationActionElement
  variant?: NotificationVariant
  icon?: React.ReactNode
}

const actionTypes = {
  ADD_NOTIFICATION: "ADD_NOTIFICATION",
  UPDATE_NOTIFICATION: "UPDATE_NOTIFICATION",
  DISMISS_NOTIFICATION: "DISMISS_NOTIFICATION",
  REMOVE_NOTIFICATION: "REMOVE_NOTIFICATION",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_NOTIFICATION"]
      notification: ToasterNotification
    }
  | {
      type: ActionType["UPDATE_NOTIFICATION"]
      notification: Partial<ToasterNotification>
    }
  | {
      type: ActionType["DISMISS_NOTIFICATION"]
      notificationId?: ToasterNotification["id"]
    }
  | {
      type: ActionType["REMOVE_NOTIFICATION"]
      notificationId?: ToasterNotification["id"]
    }

interface State {
  notifications: ToasterNotification[]
}

const notificationTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (notificationId: string) => {
  if (notificationTimeouts.has(notificationId)) {
    return
  }

  const timeout = setTimeout(() => {
    notificationTimeouts.delete(notificationId)
    dispatch({
      type: "REMOVE_NOTIFICATION",
      notificationId: notificationId,
    })
  }, NOTIFICATION_REMOVE_DELAY)

  notificationTimeouts.set(notificationId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.notification, ...state.notifications].slice(0, NOTIFICATION_LIMIT),
      }

    case "UPDATE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.notification.id ? { ...n, ...action.notification } : n
        ),
      }

    case "DISMISS_NOTIFICATION": {
      const { notificationId } = action

      if (notificationId) {
        addToRemoveQueue(notificationId)
      } else {
        state.notifications.forEach((notification) => {
          addToRemoveQueue(notification.id)
        })
      }

      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === notificationId || notificationId === undefined
            ? {
                ...n,
                open: false,
              }
            : n
        ),
      }
    }
    case "REMOVE_NOTIFICATION":
      if (action.notificationId === undefined) {
        return {
          ...state,
          notifications: [],
        }
      }
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.notificationId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { notifications: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type NotificationProps = Omit<ToasterNotification, "id" | "variant"> & {
    title: React.ReactNode;
};

function createNotification(props: Omit<ToasterNotification, "id">) {
  const id = genId()

  const update = (props: ToasterNotification) =>
    dispatch({
      type: "UPDATE_NOTIFICATION",
      notification: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_NOTIFICATION", notificationId: id })

  dispatch({
    type: "ADD_NOTIFICATION",
    notification: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Main API for displaying notifications.
 * @example notification.success({ title: "Product added!" })
 */
export const toast = {
  /** Displays a success notification (e.g., payment successful, item added to cart). */
  success: (props: NotificationProps) => {
    return createNotification({ ...props, variant: 'success' });
  },
  /** Displays an error notification (e.g., out of stock, payment failed). */
  error: (props: NotificationProps) => {
    return createNotification({ ...props, variant: 'error' });
  },
  /** Displays an info notification (e.g., your order has shipped). */
  info: (props: NotificationProps) => {
    return createNotification({ ...props, variant: 'info' });
  },
  /** Displays a warning notification (e.g., last item in stock). */
  warning: (props: NotificationProps) => {
    return createNotification({ ...props, variant: 'warning' });
  },
  /** Displays a custom notification if needed. */
  custom: (props: Omit<ToasterNotification, "id">) => {
    return createNotification(props);
  }
};


/**
 * React hook to access and manage the notification state.
 */
export function useToast() { // <-- RENAMED THIS FUNCTION
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    // Note: You may want to rename 'notifications' to 'toasts' for consistency
    notifications: state.notifications, 
    dismiss: (notificationId?: string) => dispatch({ type: "DISMISS_NOTIFICATION", notificationId }),
  }
}
export interface SetSmartLead {
  id?: string
  _id?: string
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  phoneNumber?: string
  status?: string
  leadStatus?: string
  lastMessage?: string
  lastActivity?: string
  aiEnabled?: boolean
  aiActive?: boolean
  tags?: string[]
  notes?: string
  course?: string
  email?: string
  createdAt?: string
  updatedAt?: string
  contactName?: string
}

export interface SetSmartConversation {
  id?: string
  _id?: string
  contactName?: string
  name?: string
  phone?: string
  lastMessage?: string
  lastActivity?: string
  status?: string
  aiEnabled?: boolean
  unreadCount?: number
}

export interface SetSmartUsage {
  totalConversations?: number
  conversations?: number
  aiMessages?: number
  humanMessages?: number
  qualifiedLeads?: number
  bookedSessions?: number
  responseRate?: number
}

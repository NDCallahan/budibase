import { AppNavigation } from "../../../documents"

export interface WorkspaceAppResponse {
  _id: string
  _rev: string
  name: string
  url: string
  navigation: AppNavigation
  isDefault: boolean
  createdAt: string
  updatedAt: string
  disabled?: boolean
  icon?: string
  iconColor?: string
  iconBackground?: string
  iconSize?: string
}

export interface InsertWorkspaceAppRequest {
  name: string
  url: string
  disabled?: boolean
  icon?: string
  iconColor?: string
  iconBackground?: string
  iconSize?: string
}

export interface InsertWorkspaceAppResponse {
  workspaceApp: WorkspaceAppResponse
}

export interface DuplicateWorkspaceAppResponse {
  workspaceApp: WorkspaceAppResponse
}

export interface UpdateWorkspaceAppRequest {
  _id: string
  _rev: string
  name: string
  url: string
  navigation: AppNavigation
  disabled?: boolean
  icon?: string
  iconColor?: string
  iconBackground?: string
  iconSize?: string
}

export interface UpdateWorkspaceAppResponse {
  workspaceApp: WorkspaceAppResponse
}

export interface FetchWorkspaceAppResponse {
  workspaceApps: WorkspaceAppResponse[]
}

export interface FindWorkspaceAppResponse extends WorkspaceAppResponse {}

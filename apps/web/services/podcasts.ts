import { apiClient } from '@/lib/api'

export interface DialogueTurn {
  turn_id: number
  speaker: string
  speaker_title: string
  text: string
  timestamp_formatted: string
  timestamp_seconds: number
  tone: string
  citations: string[]
}

export interface PodcastChapter {
  title: string
  start_seconds: number
  start_formatted: string
  summary: string
}

export interface PodcastScriptResponse {
  episode_id: string
  title: string
  subtitle: string
  paper_ids: string[]
  paper_titles: string[]
  total_duration_estimate_seconds: number
  chapters: PodcastChapter[]
  dialogue: DialogueTurn[]
  key_takeaways: string[]
  generated_at: string
}

export interface PodcastPreset {
  id: string
  title: string
  topic: string
  description: string
  style: string
  duration_minutes: number
}

export const podcastService = {
  async getPresets(): Promise<PodcastPreset[]> {
    return apiClient<PodcastPreset[]>('/podcast/presets')
  },

  async generatePodcast(params: {
    topic?: string
    paper_ids?: string[]
    style?: string
    duration_target_minutes?: number
  }): Promise<PodcastScriptResponse> {
    return apiClient<PodcastScriptResponse>('/podcast/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }
}

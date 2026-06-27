import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface AIIdea {
  id: string
  title: string
  description: string
  submitterId: string
  submitterName: string
  submitterDepartment: string
  createdAt: string
}

interface AIIdeasState {
  ideas: AIIdea[]
}

const initialState: AIIdeasState = {
  ideas: [],
}

const aiIdeasSlice = createSlice({
  name: "aiIdeas",
  initialState,
  reducers: {
    addIdea: (state, action: PayloadAction<AIIdea>) => {
      state.ideas.unshift(action.payload)
    },
  },
})

export const { addIdea } = aiIdeasSlice.actions
export default aiIdeasSlice.reducer

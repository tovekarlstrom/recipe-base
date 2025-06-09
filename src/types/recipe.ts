export interface Recipe {
  id?: string
  name: string
  description: string | null
  servings: number
  created_at?: string
  updated_at?: string
  recipe_ingredients: Array<{
    ingredient: string
    amount: string | null
    unit: string | null
  }>
  recipe_instructions: Array<{
    step_number: number
    instruction: string
  }>
  category?: string[]
}

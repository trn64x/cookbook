'use client'

import './App.css'
import { Form } from './components/ui/form'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Input } from './components/ui/input'
import { ArrowRight } from 'lucide-react'
import { Ollama } from '@langchain/ollama'
import { useState } from 'react'
import paper from'../public/paper.jpg'

function App() {
  type inputEdit = {
    isEdit: boolean
    value: string
    index: number
    section: 'ingredients' | 'steps'
    recipeIndex: number
  }

  const [answers, setAnswers] = useState<string[]>([])
  const [edit, setEdit] = useState<inputEdit | null>(null)

  const form = useForm({
    defaultValues: {
      prompt: '',
    },
  })

  const llm = new Ollama({
    model: 'gpt-oss:20b',
    temperature: 0.5,
    maxRetries: 2,
  })

  const onSubmit: SubmitHandler<{ prompt: string }> = async (values) => {
    const response = await llm.invoke(`Zrób przepis na ${values.prompt!} wedle takiej składni:

! NAZWA POTRAWY
! Składniki:
- 1 składnik
- 2 składnik
- 3 składnik
! Sposób przygotowania:
= krok 1
= krok 2
= krok 3
`)

    const text =
      typeof response === 'string'
        ? response
        : response?.content ?? response?.content?.[0]?.text ?? 'brak odpowiedzi...'

    setAnswers((prev) => [...prev, text])
  }

  const editValue = (
    e: React.MouseEvent<HTMLLIElement>,
    index: number,
    section: 'ingredients' | 'steps',
    recipeIndex: number
  ) => {
    setEdit({
      isEdit: true,
      value: e.currentTarget.textContent || '',
      index,
      section,
      recipeIndex,
    })
  }
  const submitValue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!edit) return

    setAnswers((prev) => {
      const updated = [...prev]
      const recipe = updated[edit.recipeIndex]

      const splitter = recipe.split('!')
      const title = splitter[1] || ''
      const ingredientsBlock = splitter[2] || ''
      const stepsBlock = splitter[3] || ''

      const ingredients = ingredientsBlock.split('-').splice(1)
      const steps = stepsBlock.split('=').splice(1)

      if (edit.section === 'ingredients') {
        ingredients[edit.index] = edit.value
      } else if (edit.section === 'steps') {
        steps[edit.index] = edit.value
      }

      const newRecipe = `!${title}! Składniki:\n- ${ingredients.join(
        '-'
      )}\n! Sposób przygotowania:\n=${steps.join('=')}`

      updated[edit.recipeIndex] = newRecipe
      return updated
    })

    setEdit(null)
  }

  return (
    <main className="min-h-screen flex justify-center items-center w-screen">
      <div className="w-2xl min-h-screen bg-secondary py-5 flex flex-col gap-4">
        <span className="text-2xl font-mono">Książka kucharska</span>

        <Form {...form}>
          <form className="flex flex-row m-3 gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <Input {...form.register('prompt')} required />
            <button
              className="h-9 p-0 flex justify-center items-center text-center"
              type="submit"
            >
              <ArrowRight />
            </button>
          </form>
        </Form>
        <div className="m-10 flex flex-col gap-4 text-left">
          {answers.length ? (
            answers.map((value, recipeIndex) => {
              const splitter = value.split('!')
              const title = splitter[1] || ''
              const ingredients = splitter[2]?.split('-').splice(1) || []
              const steps = splitter[3]?.split('=').splice(1) || []

              return (
                <div key={recipeIndex} style={{backgroundImage: `url(${paper})`}} className="flex rounded-sm flex-col gap-6">
                  <p className="font-bold m-2 text-black text-3xl">{title}</p>

                  <div>
                    <p className="text-2xl m-2 text-black font-bold">Składniki:</p>
                    <ul className="list-disc ml-6 flex flex-col gap-2">
                      {ingredients.map((ingredient, i) => (
                        <li key={i}>
                          {edit?.isEdit &&
                          edit.recipeIndex === recipeIndex &&
                          edit.section === 'ingredients' &&
                          edit.index === i ? (
                            <form onSubmit={submitValue}>
                              <Input
                                value={edit.value}
                                onChange={(e) =>
                                  setEdit((prev) =>
                                    prev ? { ...prev, value: e.target.value } : prev
                                  )
                                }
                              />
                              <button type="submit" className="mt-1">
                                Zapisz
                              </button>
                            </form>
                          ) : (
                            <span
                              onClick={(e) =>
                                editValue(e, i, 'ingredients', recipeIndex)
                              }
                              className="text-black cursor-pointer hover:underline"
                            >
                              {ingredient.trim()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-l-2 mx-5 my-4 border-black pl-4">
                    <p className="font-bold text-2xl mb-2 text-black">Sposób przygotowania:</p>
                    <ul className="list-decimal ml-6 flex flex-col gap-2">
                      {steps.map((step, i) => (
                        <li key={i}>
                          {edit?.isEdit &&
                          edit.recipeIndex === recipeIndex &&
                          edit.section === 'steps' &&
                          edit.index === i ? (
                            <form onSubmit={submitValue}>
                              <Input
                                value={edit.value}
                                onChange={(e) =>
                                  setEdit((prev) =>
                                    prev ? { ...prev, value: e.target.value } : prev
                                  )
                                }
                              />
                              <button type="submit" className="mt-1">
                                Zapisz
                              </button>
                            </form>
                          ) : (
                            <span
                              onClick={(e) => editValue(e, i, 'steps', recipeIndex)}
                              className="text-black cursor-pointer hover:underline"
                            >
                              {step.trim()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-gray-300">
              Napisz mi samą nazwę potrawy, a ja ci przygotuję przepis.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

export default App

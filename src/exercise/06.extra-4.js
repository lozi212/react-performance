// Starting point for the Recoil Extra Credit
// 💯 use recoil (exercise)
// http://localhost:3000/isolated/exercise/06.extra-4.js

import * as React from 'react'
import {
  useForceRerender,
  useDebouncedState,
  AppGrid,
} from '../utils'

import {
  RecoilRoot,
  useRecoilState,
  useRecoilCallback,
  atomFamily,
} from 'recoil'

const AppStateContext = React.createContext()

// ============================================================
// INITIAL GRID
// ============================================================

const initialGrid = Array.from({length: 100}, () =>
  Array.from({length: 100}, () => Math.random() * 100),
)

// ============================================================
// 1. CREATE A RECOIL ATOM FOR EACH CELL
// ============================================================

// Each cell gets its own piece of state.
//
// Example:
// cellAtoms({row: 0, column: 0})
// cellAtoms({row: 0, column: 1})
// cellAtoms({row: 1, column: 0})
//
// This means changing one cell does not require the entire
// grid state to change.

const cellAtoms = atomFamily({
  key: 'cell',
  default: ({row, column}) => initialGrid[row][column],
})

// ============================================================
// 2. UPDATE GRID WITH RECOIL
// ============================================================

// This replaces the old UPDATE_GRID reducer action.
//
// Recoil allows us to update individual cell atoms.

function useUpdateGrid() {
  return useRecoilCallback(({set}) => ({rows, columns}) => {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        if (Math.random() > 0.7) {
          set(
            cellAtoms({row, column}),
            Math.random() * 100,
          )
        }
      }
    }
  })
}

// ============================================================
// 3. APP STATE
// ============================================================

// The grid is no longer stored here.
// Recoil owns the grid state.
//
// The dogName is still handled by the normal React reducer.

function appReducer(state, action) {
  switch (action.type) {
    case 'TYPED_IN_DOG_INPUT': {
      return {
        ...state,
        dogName: action.dogName,
      }
    }

    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

// ============================================================
// 4. APP PROVIDER
// ============================================================

function AppProvider({children}) {
  const [state, dispatch] = React.useReducer(appReducer, {
    dogName: '',
  })

  const value = [state, dispatch]

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

// ============================================================
// 5. USE APP STATE
// ============================================================

function useAppState() {
  const context = React.useContext(AppStateContext)

  if (!context) {
    throw new Error(
      'useAppState must be used within the AppProvider',
    )
  }

  return context
}

// ============================================================
// 6. GRID
// ============================================================

function Grid() {
  // We no longer use dispatch to update the grid.
  // Instead, we get updateGrid from Recoil.

  const updateGrid = useUpdateGrid()

  const [rows, setRows] = useDebouncedState(50)
  const [columns, setColumns] = useDebouncedState(50)

  const updateGridData = () => {
    updateGrid({
      rows,
      columns,
    })
  }

  return (
    <AppGrid
      onUpdateGrid={updateGridData}
      rows={rows}
      handleRowsChange={setRows}
      columns={columns}
      handleColumnsChange={setColumns}
      Cell={Cell}
    />
  )
}

// ============================================================
// 7. CELL
// ============================================================

function Cell({row, column}) {
  // Each Cell subscribes only to its own Recoil atom.

  const [cell, setCell] = useRecoilState(
    cellAtoms({
      row,
      column,
    }),
  )

  // Clicking the cell updates only this cell.

  const handleClick = () => {
    setCell(Math.random() * 100)
  }

  return (
    <button
      className="cell"
      onClick={handleClick}
      style={{
        color: cell > 50 ? 'white' : 'black',
        backgroundColor: `rgba(0, 0, 0, ${cell / 100})`,
      }}
    >
      {Math.floor(cell)}
    </button>
  )
}

// ============================================================
// 8. DOG NAME INPUT
// ============================================================

function DogNameInput() {
  const [state, dispatch] = useAppState()

  const {dogName} = state

  function handleChange(event) {
    const newDogName = event.target.value

    dispatch({
      type: 'TYPED_IN_DOG_INPUT',
      dogName: newDogName,
    })
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <label htmlFor="dogName">Dog Name</label>

      <input
        value={dogName}
        onChange={handleChange}
        id="dogName"
        placeholder="Toto"
      />

      {dogName ? (
        <div>
          <strong>{dogName}</strong>, I've a feeling we're not in Kansas anymore
        </div>
      ) : null}
    </form>
  )
}

// ============================================================
// 9. APP
// ============================================================

function App() {
  const forceRerender = useForceRerender()

  return (
    <div className="grid-app">
      <button onClick={forceRerender}>
        force rerender
      </button>

      {/* RecoilRoot is required for Recoil */}

      <RecoilRoot>
        <AppProvider>
          <div>
            <DogNameInput />

            <Grid />
          </div>
        </AppProvider>
      </RecoilRoot>
    </div>
  )
}

export default App

/*
eslint
  no-func-assign: 0,
*/
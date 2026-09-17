// Fix "perf death by a thousand cuts"
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import {
  useForceRerender,
  AppGrid,
  updateGridState,
} from '../utils'

const AppStateContext = React.createContext()
const AppDispatchContext = React.createContext()

// ============================================================
// App State
// ============================================================

const initialState = {
  dogName: 'Toto',
  grid: updateGridState(50, 50),
}

// ============================================================
// Reducer
// ============================================================

function appReducer(state, action) {
  switch (action.type) {
    case 'TYPED_IN_DOG_INPUT': {
      return {
        ...state,
        dogName: action.dogName,
      }
    }

    case 'UPDATE_GRID_CELL': {
      const grid = state.grid.map((row, rowIndex) =>
        row.map((cell, columnIndex) => {
          if (
            rowIndex === action.row &&
            columnIndex === action.column
          ) {
            return action.value ?? Math.random() * 100
          }

          return cell
        }),
      )

      return {
        ...state,
        grid,
      }
    }

    case 'UPDATE_GRID': {
      return {
        ...state,
        grid: updateGridState(action.rows, action.columns),
      }
    }

    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

// ============================================================
// App Provider
// ============================================================

function AppProvider({children}) {
  const [state, dispatch] = React.useReducer(
    appReducer,
    initialState,
  )

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

// ============================================================
// App State Hooks
// ============================================================

function useAppState() {
  return React.useContext(AppStateContext)
}

function useAppDispatch() {
  return React.useContext(AppDispatchContext)
}

// ============================================================
// Update Grid Hook
// ============================================================

function useUpdateGrid() {
  const dispatch = useAppDispatch()

  return React.useCallback(
    ({rows, columns}) => {
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          if (Math.random() > 0.7) {
            dispatch({
              type: 'UPDATE_GRID_CELL',
              row,
              column,
              value: Math.random() * 100,
            })
          }
        }
      }
    },
    [dispatch],
  )
}

// ============================================================
// withStateSlice
// ============================================================

function withStateSlice(Comp, slice) {
  const MemoComp = React.memo(Comp)

  function Wrapper(props, ref) {
    const state = useAppState()

    return (
      <MemoComp
        ref={ref}
        state={slice(state, props)}
        {...props}
      />
    )
  }

  Wrapper.displayName = `withStateSlice(${
    Comp.displayName || Comp.name
  })`

  return React.memo(React.forwardRef(Wrapper))
}

// ============================================================
// Cell
// ============================================================

function Cell({state: cell, row, column}) {
  const dispatch = useAppDispatch()

  const handleClick = React.useCallback(() => {
    dispatch({
      type: 'UPDATE_GRID_CELL',
      row,
      column,
    })
  }, [dispatch, row, column])

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

// Give Cell only the piece of state that belongs to it.
const CellWithStateSlice = withStateSlice(
  Cell,
  (state, {row, column}) => state.grid[row][column],
)

// ============================================================
// Grid
// ============================================================

function Grid({rows, columns}) {
  return (
    <AppGrid
      rows={rows}
      columns={columns}
      Cell={CellWithStateSlice}
    />
  )
}

const MemoizedGrid = React.memo(Grid)

// ============================================================
// Dog Name
// ============================================================

function DogName() {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const handleChange = event => {
    dispatch({
      type: 'TYPED_IN_DOG_INPUT',
      dogName: event.target.value,
    })
  }

  return (
    <label>
      Dog Name
      <input
        value={state.dogName}
        onChange={handleChange}
      />
    </label>
  )
}

// ============================================================
// App
// ============================================================

function App() {
  const [rows, setRows] = React.useState(50)
  const [columns, setColumns] = React.useState(50)

  const forceRerender = useForceRerender()
  const updateGrid = useUpdateGrid()

  const [keepGridDataUpdated, setKeepGridDataUpdated] =
    React.useState(false)

  React.useEffect(() => {
    if (!keepGridDataUpdated) {
      return
    }

    const interval = setInterval(() => {
      updateGrid({
        rows,
        columns,
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [
    keepGridDataUpdated,
    rows,
    columns,
    updateGrid,
  ])

  return (
    <div>
      <button onClick={forceRerender}>
        force rerender
      </button>

      <div>
        <DogName />
      </div>

      <div>
        <button
          onClick={() =>
            updateGrid({
              rows,
              columns,
            })
          }
        >
          Update Grid Data
        </button>
      </div>

      <div>
        <label>
          Keep Grid Data updated
          <input
            type="checkbox"
            checked={keepGridDataUpdated}
            onChange={event =>
              setKeepGridDataUpdated(event.target.checked)
            }
          />
        </label>
      </div>

      <div>
        <label>
          Rows to display:{' '}
          <input
            type="number"
            value={rows}
            onChange={event =>
              setRows(Number(event.target.value))
            }
          />
        </label>
      </div>

      <div>
        <label>
          Columns to display:{' '}
          <input
            type="number"
            value={columns}
            onChange={event =>
              setColumns(Number(event.target.value))
            }
          />
        </label>
      </div>

      <MemoizedGrid
        rows={rows}
        columns={columns}
      />
    </div>
  )
}

// ============================================================
// Export
// ============================================================

function AppWithProvider() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}

export default AppWithProvider
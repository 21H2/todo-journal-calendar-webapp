import { useState, useEffect } from 'react'
import { Calendar } from 'react-calendar'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn, slideUp, scale, staggerChildren, listItem, buttonTap, hoverScale } from './utils/animations'
import { PlusIcon, CheckIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import { DynamicBackground } from './components/DynamicBackground'
import './App.css'

function AppContent() {
  const { currentUser, logout } = useAuth()
  // State for theme toggle
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // State for todo list
  const [todos, setTodos] = useState([])
  const [todoInput, setTodoInput] = useState('')
  const [editingTodoId, setEditingTodoId] = useState(null)

  // State for calendar
  const [date, setDate] = useState(new Date())

  // State for journal
  const [journalEntries, setJournalEntries] = useState({})
  const [journalInput, setJournalInput] = useState('')

  // Load todos from Firestore
  useEffect(() => {
    async function loadTodos() {
      const q = query(
        collection(db, 'todos'),
        where('userId', '==', currentUser.uid)
      )
      const querySnapshot = await getDocs(q)
      const loadedTodos = []
      querySnapshot.forEach((doc) => {
        loadedTodos.push({ id: doc.id, ...doc.data() })
      })
      setTodos(loadedTodos)
    }
    if (currentUser) {
      loadTodos()
    }
  }, [currentUser])

  // Load journal entries from Firestore
  useEffect(() => {
    async function loadJournalEntries() {
      const q = query(
        collection(db, 'journal'),
        where('userId', '==', currentUser.uid)
      )
      const querySnapshot = await getDocs(q)
      const entries = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        entries[data.date] = data.content
      })
      setJournalEntries(entries)
    }
    if (currentUser) {
      loadJournalEntries()
    }
  }, [currentUser])

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Add todo
  const addTodo = async () => {
    if (todoInput.trim() === '') return
    
    if (editingTodoId !== null) {
      // Update existing todo
      const todoRef = doc(db, 'todos', editingTodoId)
      await updateDoc(todoRef, { text: todoInput })
      setTodos(todos.map(todo => 
        todo.id === editingTodoId ? { ...todo, text: todoInput } : todo
      ))
      setEditingTodoId(null)
    } else {
      // Add new todo
      const newTodo = {
        text: todoInput,
        completed: false,
        date: format(new Date(), 'yyyy-MM-dd'),
        userId: currentUser.uid
      }
      const docRef = await addDoc(collection(db, 'todos'), newTodo)
      setTodos([...todos, { id: docRef.id, ...newTodo }])
    }
    
    setTodoInput('')
  }

  // Toggle todo completion
  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id)
    const todoRef = doc(db, 'todos', id)
    await updateDoc(todoRef, { completed: !todo.completed })
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  // Delete todo
  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, 'todos', id))
    setTodos(todos.filter(todo => todo.id !== id))
  }

  // Edit todo
  const editTodo = (todo) => {
    setTodoInput(todo.text)
    setEditingTodoId(todo.id)
  }

  // Add journal entry
  const addJournalEntry = async () => {
    if (journalInput.trim() === '') return
    
    const dateKey = format(date, 'yyyy-MM-dd')
    const q = query(
      collection(db, 'journal'),
      where('userId', '==', currentUser.uid),
      where('date', '==', dateKey)
    )
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      // Update existing entry
      const docRef = doc(db, 'journal', querySnapshot.docs[0].id)
      await updateDoc(docRef, { content: journalInput })
    } else {
      // Add new entry
      await addDoc(collection(db, 'journal'), {
        userId: currentUser.uid,
        date: dateKey,
        content: journalInput
      })
    }

    setJournalEntries({
      ...journalEntries,
      [dateKey]: journalInput
    })
    setJournalInput('')
  }

  // Get journal entry for selected date
  const getJournalEntry = () => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return journalEntries[dateKey] || ''
  }

  // Get todos for selected date
  const getTodosForSelectedDate = () => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return todos.filter(todo => todo.date === dateKey)
  }

  return (
    <motion.div 
      className="min-h-screen p-4 md:p-8 transition-colors duration-300 relative"
      {...fadeIn}
    >
      <DynamicBackground />
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary-secondary">
          Bento Planner
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
          <motion.button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            whileTap={buttonTap}
            whileHover={hoverScale}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Todo List */}
        <motion.div 
          className="glass rounded-bento p-6 shadow-bento hover:shadow-bento-hover transition-all duration-300 col-span-1 md:col-span-1 lg:col-span-1"
          variants={slideUp}
          whileHover={hoverScale}
          layout
        >
          <h2 className="text-2xl font-semibold mb-4 gradient-text-primary">Tasks</h2>
          
          <div className="flex mb-4">
            <input
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new task..."
              className="flex-grow p-2 rounded-l-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <motion.button
              onClick={addTodo}
              className="p-2 rounded-r-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              whileTap={buttonTap}
              whileHover={hoverScale}
            >
              {editingTodoId !== null ? <PencilIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {getTodosForSelectedDate().length === 0 ? (
                <motion.p 
                  key="empty"
                  className="text-gray-500 dark:text-gray-400 text-center py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No tasks for this day
                </motion.p>
              ) : (
                getTodosForSelectedDate().map(todo => (
                <motion.div 
                  key={todo.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${todo.completed ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'} border border-gray-200 dark:border-gray-700`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center">
                    <button 
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${todo.completed ? 'bg-green-500' : 'border-2 border-gray-300 dark:border-gray-600'}`}
                    >
                      {todo.completed && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>
                    <span className={todo.completed ? 'line-through text-gray-500' : ''}>{todo.text}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => editTodo(todo)}
                      className="text-gray-500 hover:text-primary-500 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div 
          className="glass rounded-bento p-6 shadow-bento hover:shadow-bento-hover transition-shadow duration-300 col-span-1 md:col-span-1 lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold mb-4 gradient-text-secondary">Calendar</h2>
          <div className="calendar-container">
            <Calendar 
              onChange={setDate} 
              value={date} 
              className="rounded-lg border-none shadow-sm w-full bg-white dark:bg-gray-900 p-2"
              tileClassName={({ date }) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const hasJournal = journalEntries[dateStr]
                const hasTodos = todos.some(todo => todo.date === dateStr)
                
                if (hasJournal && hasTodos) return 'has-journal has-todos'
                if (hasJournal) return 'has-journal'
                if (hasTodos) return 'has-todos'
                return ''
              }}
            />
          </div>
          <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
            Selected: <span className="font-medium">{format(date, 'MMMM d, yyyy')}</span>
          </p>
        </motion.div>

        {/* Journal */}
        <motion.div 
          className="glass rounded-bento p-6 shadow-bento hover:shadow-bento-hover transition-shadow duration-300 col-span-1 md:col-span-2 lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold mb-4 gradient-text-primary-secondary">Journal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </p>
          
          <textarea
            value={journalInput || getJournalEntry()}
            onChange={(e) => setJournalInput(e.target.value)}
            placeholder="Write your thoughts for today..."
            className="w-full h-[200px] p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          
          <motion.button
            onClick={addJournalEntry}
            className="mt-3 w-full p-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 transition-colors"
            whileTap={buttonTap}
            whileHover={hoverScale}
          >
            Save Entry
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>Bento Planner © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  )
}

function AppWrapper() {
  const { currentUser } = useAuth()

  return currentUser ? <AppContent /> : <Auth />
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ExamProvider } from './context/ExamContext'
import Layout from './components/Layout'
import TosUpload from './pages/TosUpload'
import ExamConfig from './pages/ExamConfig'
import QuestionManager from './pages/QuestionManager'
import ReviewExport from './pages/ReviewExport'

function App() {
  return (
    <ExamProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/tos" replace />} />
            <Route path="/tos" element={<TosUpload />} />
            <Route path="/config" element={<ExamConfig />} />
            <Route path="/questions" element={<QuestionManager />} />
            <Route path="/export" element={<ReviewExport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ExamProvider>
  )
}

export default App

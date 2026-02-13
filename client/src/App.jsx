import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CompanyOverview from './pages/CompanyOverview';
import TasksDeadlines from './pages/TasksDeadlines';
import DocumentVault from './pages/DocumentVault';
import Support from './pages/Support';
import Billing from './pages/Billing';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="companies/:id" element={<CompanyOverview />} />
        <Route path="tasks" element={<TasksDeadlines />} />
        <Route path="documents" element={<DocumentVault />} />
        <Route path="support" element={<Support />} />
        <Route path="billing" element={<Billing />} />
      </Route>
    </Routes>
  );
}
export default App;

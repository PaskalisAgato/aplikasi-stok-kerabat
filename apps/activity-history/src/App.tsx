import Layout from '@shared/Layout';
import ActivityLogPage from '@shared/components/ActivityLogPage';

function App() {
  return (
    <Layout
      currentPort={5180}
      title="Riwayat Aktivitas"
      subtitle="Security & Operation Logs"
    >
      <ActivityLogPage />
    </Layout>
  );
}

export default App;
